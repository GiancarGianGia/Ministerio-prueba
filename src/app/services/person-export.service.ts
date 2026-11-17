import { Injectable } from '@angular/core';
import { strToU8, zipSync } from 'fflate';
import { Person } from './models';

@Injectable({ providedIn: 'root' })
export class PersonExportService {
    exportToCsv(persons: Person[]): void {
        const { headers, rows } = this.buildExportTable(persons);
        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\r\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, `trabajadores-${this.currentDateSuffix()}.csv`);
    }

    exportToExcel(persons: Person[]): void {
        const { headers, rows } = this.buildExportTable(persons);
        const worksheetRows = [headers, ...rows];

        const columnName = (index: number): string => {
            let name = '';
            let current = index + 1;
            while (current > 0) {
                const remainder = (current - 1) % 26;
                name = String.fromCharCode(65 + remainder) + name;
                current = Math.floor((current - 1) / 26);
            }
            return name;
        };

        const escapeXml = (value: string): string =>
            value
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

        const columns = headers
            .map((header, index) => {
                const maxLength = Math.max(header.length, ...rows.map((row) => String(row[index] ?? '').length));
                const width = Math.min(40, Math.max(12, maxLength + 2));
                return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
            })
            .join('');

        const sheetData = worksheetRows
            .map(
                (row, rowIndex) =>
                    `<row r="${rowIndex + 1}">${row
                        .map(
                            (value, columnIndex) =>
                                `<c r="${columnName(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value ?? ''))}</t></is></c>`
                        )
                        .join('')}</row>`
            )
            .join('');

        const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${columns}</cols><sheetData>${sheetData}</sheetData></worksheet>`;

        const files = {
            '[Content_Types].xml': strToU8(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'
            ),
            '_rels/.rels': strToU8(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
            ),
            'xl/workbook.xml': strToU8(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Trabajadores" sheetId="1" r:id="rId1"/></sheets></workbook>'
            ),
            'xl/_rels/workbook.xml.rels': strToU8(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'
            ),
            'xl/worksheets/sheet1.xml': strToU8(worksheetXml)
        };

        const workbook = zipSync(files);
        const blob = new Blob([workbook.slice().buffer as ArrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        this.downloadBlob(blob, `trabajadores-${this.currentDateSuffix()}.xlsx`);
    }

    private buildExportTable(persons: Person[]): { headers: string[]; rows: (string | number)[][] } {
        const yesNo = (value: boolean | undefined): string => (value === undefined ? '' : value ? 'Sí' : 'No');
        const text = (...parts: (string | number | undefined | null)[]): string =>
            parts.filter((part) => part !== undefined && part !== null && String(part).trim() !== '').join(' ');
        const fullName = (item: { firstName?: string; secondName?: string; lastName?: string; secondLastName?: string }): string =>
            [item.firstName, item.secondName, item.lastName, item.secondLastName].filter(Boolean).join(' ');
        const childrenSummary = (person: Person): string =>
            (person.familyData?.children ?? [])
                .map((child) => text(child.name, child.birthDate ? `(${child.birthDate})` : '', child.documentNumber ? `- ${child.documentNumber}` : ''))
                .join('; ');
        const familyMembersSummary = (person: Person): string =>
            (person.familyMembers ?? [])
                .map((member) =>
                    text(
                        fullName(member),
                        member.relationship ? `(${member.relationship})` : '',
                        member.hasDocument && member.documentNumber ? `- ${member.documentNumber}` : '- Sin documento'
                    )
                )
                .join('; ');

        const headers = [
            'Código',
            'Tipo de documento',
            'Nro. de documento',
            'Primer nombre',
            'Segundo nombre',
            'Primer apellido',
            'Segundo apellido',
            'Lugar de nacimiento',
            'Fecha de nacimiento',
            'Sexo',
            'Teléfono personal',
            'Teléfono de habitación',
            'Correo electrónico',
            'RIF',
            'Dirección',
            'Ciudad',
            'Departamento',
            'Cargo',
            'Estado del trabajador',
            'Observaciones',
            'Fecha de registro',
            'Última actualización',
            'Registrado por',
            'Estado civil',
            'Cónyuge',
            'Documento del cónyuge',
            'Teléfono del cónyuge',
            '¿Cónyuge trabaja en el MPPPST?',
            'Departamento del cónyuge',
            'Cantidad de hijos',
            'Hijos registrados',
            'Familiares registrados',
            'Situación de vacaciones',
            'Inicio de las últimas vacaciones',
            'Fin de las últimas vacaciones',
            'Días pendientes de vacaciones',
            'Observaciones de vacaciones',
            'Contacto de emergencia',
            'Teléfono de emergencia',
            'Parentesco del contacto de emergencia',
            'Contacto de emergencia secundario',
            'Teléfono de emergencia secundario',
            'Grupo sanguíneo',
            'Lateralidad',
            '¿Enfermedad ocupacional?',
            'Descripción de la enfermedad ocupacional',
            '¿Posee discapacidad?',
            'Tipo de discapacidad',
            'Grado de discapacidad',
            'Código CONAPDIS',
            'Descripción de la discapacidad',
            '¿Posee alguna patología?',
            'Descripción de la patología',
            'Medicación de la patología',
            'Alergias',
            'Observaciones médicas',
            'Municipio',
            'Parroquia',
            'Tipo de vía',
            'Detalles de la vía',
            'Tipo de edificación',
            'Detalles de la edificación',
            'Tipo de unidad',
            'Detalles de la unidad',
            'Tipo de zona',
            'Detalles de la zona',
            'Punto de referencia',
            'Tipo de vivienda',
            'Condición de la vivienda',
            'Años viviendo en la dirección',
            'Número de habitaciones',
            'Número de personas en el hogar',
            '¿Posee servicios básicos?',
            'Observaciones de vivienda',
            'Registro militar',
            'Número de registro militar',
            'Talla de camisa',
            'Talla de pantalón',
            'Talla de calzado',
            'Talla de chaqueta',
            'Observaciones adicionales',
            'Ubicación administrativa',
            'Estado administrativo',
            'Ubicación física',
            'Código de teléfono de oficina',
            'Teléfono de oficina',
            'Cargo titular',
            'Tipo de trabajador',
            'Código de nómina',
            'Fecha de ingreso al MPPPST',
            'Fecha de ingreso a la administración pública',
            'Observaciones laborales',
            'Nivel académico',
            'Especialidad',
            '¿Graduado(a)?',
            'Universidad',
            'Año de culminación (real o estimado)',
            '¿Desea continuar sus estudios?',
            'Opciones de estudio',
            '¿Desea participar como facilitador?'
        ];

        const rows = persons.map((person) => {
            const family = person.familyData;
            const vacation = person.vacationData;
            const medical = person.medicalData;
            const housing = person.housingData;
            const additional = person.additionalData;
            const labor = person.laborData;
            const academic = person.academicData;

            return [
                person.id,
                person.documentType,
                person.documentNumber,
                person.firstName,
                person.secondName ?? '',
                person.lastName,
                person.secondLastName ?? '',
                person.birthPlace ?? '',
                person.birthDate,
                person.gender,
                person.phone,
                person.homePhone ?? '',
                person.email ?? '',
                person.rif ?? '',
                person.address,
                person.city,
                person.department,
                person.type,
                person.status,
                person.notes,
                new Date(person.createdAt).toLocaleString('es-VE'),
                new Date(person.updatedAt).toLocaleString('es-VE'),
                person.createdBy,
                family?.maritalStatus ?? '',
                family?.spouseName ?? '',
                family?.spouseDocumentNumber ?? '',
                family?.spousePhone ?? '',
                yesNo(family?.spouseWorksAtMpppst),
                family?.spouseMpppstDepartment ?? '',
                family?.numberOfChildren ?? family?.children?.length ?? 0,
                childrenSummary(person),
                familyMembersSummary(person),
                vacation?.status ?? '',
                vacation?.lastVacationStart ?? '',
                vacation?.lastVacationEnd ?? '',
                vacation?.pendingDays ?? '',
                vacation?.observations ?? '',
                medical?.emergencyContactName ?? '',
                medical?.emergencyContactPhone ?? '',
                medical?.emergencyContactRelationship ?? '',
                medical?.secondaryEmergencyContactName ?? '',
                medical?.secondaryEmergencyContactPhone ?? '',
                medical?.bloodType ?? '',
                medical?.laterality ?? '',
                yesNo(medical?.hasOccupationalDisease),
                medical?.occupationalDiseaseDescription ?? '',
                yesNo(medical?.hasDisability),
                medical?.disabilityType ?? '',
                medical?.disabilityGrade ?? '',
                medical?.conapdisCode ?? '',
                medical?.disabilityDescription ?? '',
                yesNo(medical?.hasPathology),
                medical?.pathologyDescription ?? '',
                medical?.pathologyMedication ?? '',
                medical?.allergies ?? '',
                medical?.observations ?? '',
                housing?.municipality ?? '',
                housing?.parish ?? '',
                housing?.thoroughfareType ?? '',
                housing?.thoroughfareDetails ?? '',
                housing?.buildingType ?? '',
                housing?.buildingDetails ?? '',
                housing?.unitType ?? '',
                housing?.unitDetails ?? '',
                housing?.zoneType ?? '',
                housing?.zoneDetails ?? '',
                housing?.referencePoint ?? '',
                housing?.housingType ?? '',
                housing?.housingCondition ?? '',
                housing?.yearsAtAddress ?? '',
                housing?.numberOfRooms ?? '',
                housing?.numberOfPeopleInHouse ?? '',
                yesNo(housing?.hasBasicServices),
                housing?.observations ?? '',
                additional?.militaryRegistration ?? '',
                additional?.militaryRegistrationNumber ?? '',
                additional?.shirtSize ?? '',
                additional?.pantsSize ?? '',
                additional?.shoeSize ?? '',
                additional?.jacketSize ?? '',
                additional?.observations ?? '',
                labor?.administrativeLocation ?? '',
                labor?.administrativeState ?? '',
                labor?.physicalLocation ?? '',
                labor?.officePhoneCode ?? '',
                labor?.officePhone ?? '',
                labor?.titularPosition ?? '',
                labor?.workerType ?? '',
                labor?.payrollCode ?? '',
                labor?.mpppstEntryDate ?? '',
                labor?.publicAdministrationEntryDate ?? '',
                labor?.observations ?? '',
                academic?.academicLevel ?? '',
                academic?.specialty ?? '',
                yesNo(academic?.graduated),
                academic?.university ?? '',
                academic?.completionYear ?? '',
                academic?.continueStudies ?? '',
                academic?.studyOptions ?? '',
                yesNo(academic?.wantsToFacilitate)
            ];
        });

        return { headers, rows };
    }

    private downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    private currentDateSuffix(): string {
        return new Date().toISOString().slice(0, 10);
    }
}
