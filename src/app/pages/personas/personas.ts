import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { strToU8, zipSync } from 'fflate';
import { AuthService } from '@/app/services/auth.service';
import {
    DEPARTMENTS,
    DOCUMENT_TYPES,
    GENDERS,
    NewPersonInput,
    Person,
    PERSON_STATUSES,
    PERSON_TYPES,
    TagSeverity
} from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';
import { validateBirthDate, validateDocument, validateEmail, validatePersonName, validatePhone } from '@/app/services/validators';

@Component({
    selector: 'app-personas',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './personas.html'
})
export class Personas {
    private readonly personService = inject(PersonService);

    private readonly auth = inject(AuthService);

    private readonly messageService = inject(MessageService);

    private readonly confirmationService = inject(ConfirmationService);

    readonly persons = this.personService.persons;

    readonly stats = this.personService.stats;

    selectedPersons: Person[] | null = null;

    filterType = signal<string | null>(null);

    filterStatus = signal<string | null>(null);

    readonly filteredPersons = computed(() =>
        this.persons().filter((person) => {
            const matchesType = !this.filterType() || person.type === this.filterType();
            const matchesStatus = !this.filterStatus() || person.status === this.filterStatus();
            return matchesType && matchesStatus;
        })
    );

    readonly typeOptions = PERSON_TYPES.map((value) => ({ label: value, value }));

    readonly statusOptions = PERSON_STATUSES.map((value) => ({ label: value, value }));

    readonly documentTypeOptions = DOCUMENT_TYPES.map((value) => ({ label: value, value }));

    readonly genderOptions = GENDERS.map((value) => ({ label: value, value }));

    readonly departmentOptions = DEPARTMENTS.map((value) => ({ label: value, value }));

    personDialog = false;

    person: Person = this.emptyPerson();

    submitted = false;

    @ViewChild('dt') dt!: Table;

    private get actor(): string {
        return this.auth.currentUser()?.fullName ?? 'Sistema';
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    editPerson(person: Person): void {
        this.person = { ...person };
        this.submitted = false;
        this.personDialog = true;
    }

    hideDialog(): void {
        this.personDialog = false;
        this.submitted = false;
    }

    private emptyPerson(): Person {
        return {
            id: '',
            firstName: '',
            lastName: '',
            documentType: DOCUMENT_TYPES[0],
            documentNumber: '',
            birthDate: '',
            gender: GENDERS[0],
            email: '',
            phone: '',
            address: '',
            city: '',
            department: DEPARTMENTS[0],
            type: '',
            status: PERSON_STATUSES[0],
            notes: '',
            createdAt: '',
            updatedAt: '',
            createdBy: ''
        };
    }

    firstNameError(): string {
        return this.submitted ? (validatePersonName(this.person.firstName, 'nombres') ?? '') : '';
    }

    lastNameError(): string {
        return this.submitted ? (validatePersonName(this.person.lastName, 'apellidos') ?? '') : '';
    }

    documentError(): string {
        if (!this.submitted) {
            return '';
        }
        return validateDocument(this.person.documentType, this.person.documentNumber) ?? '';
    }

    birthDateError(): string {
        if (!this.submitted || !this.person.birthDate) {
            return '';
        }
        return validateBirthDate(this.person.birthDate) ?? '';
    }

    emailError(): string {
        if (!this.submitted) {
            return '';
        }
        return validateEmail(this.person.email) ?? '';
    }

    phoneError(): string {
        if (!this.submitted || !this.person.phone) {
            return '';
        }
        return validatePhone(this.person.phone) ?? '';
    }

    savePerson(): void {
        this.submitted = true;

        if (!this.person.firstName?.trim() || !this.person.lastName?.trim() || !this.person.documentNumber?.trim() || !this.person.email?.trim() || !this.person.type?.trim()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Formulario incompleto',
                detail: 'Completa los campos obligatorios para guardar los cambios.',
                life: 3500
            });
            return;
        }

        const nameErr = validatePersonName(this.person.firstName, 'nombres');
        if (nameErr) {
            this.messageService.add({
                severity: 'error',
                summary: 'Nombres inválidos',
                detail: nameErr,
                life: 3500
            });
            return;
        }

        const lastNameErr = validatePersonName(this.person.lastName, 'apellidos');
        if (lastNameErr) {
            this.messageService.add({
                severity: 'error',
                summary: 'Apellidos inválidos',
                detail: lastNameErr,
                life: 3500
            });
            return;
        }

        const docErr = validateDocument(this.person.documentType, this.person.documentNumber);
        if (docErr) {
            this.messageService.add({
                severity: 'error',
                summary: 'Documento inválido',
                detail: docErr,
                life: 4000
            });
            return;
        }

        if (this.person.birthDate) {
            const birthErr = validateBirthDate(this.person.birthDate);
            if (birthErr) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Fecha inválida',
                    detail: birthErr,
                    life: 4000
                });
                return;
            }
        }

        const emailErr = validateEmail(this.person.email);
        if (emailErr) {
            this.messageService.add({
                severity: 'error',
                summary: 'Correo inválido',
                detail: emailErr,
                life: 3500
            });
            return;
        }

        if (this.person.phone) {
            const phoneErr = validatePhone(this.person.phone);
            if (phoneErr) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Teléfono inválido',
                    detail: phoneErr,
                    life: 4000
                });
                return;
            }
        }

        if (this.personService.documentExists(this.person.documentNumber, this.person.id)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Documento duplicado',
                detail: 'Ya existe otro trabajador registrado con ese número de documento.',
                life: 4000
            });
            return;
        }

        const input: NewPersonInput = {
            firstName: this.person.firstName,
            lastName: this.person.lastName,
            documentType: this.person.documentType,
            documentNumber: this.person.documentNumber,
            birthDate: this.person.birthDate,
            gender: this.person.gender,
            email: this.person.email,
            phone: this.person.phone,
            address: this.person.address,
            city: this.person.city,
            department: this.person.department,
            type: this.person.type,
            status: this.person.status,
            notes: this.person.notes
        };

        const updated = this.personService.update(this.person.id, input, this.actor);

        if (!updated) {
            this.messageService.add({
                severity: 'error',
                summary: 'No se pudo guardar',
                detail: 'El trabajador ya no existe en el sistema.',
                life: 3500
            });
            return;
        }

        this.personDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Trabajador actualizado',
            detail: `${updated.firstName} ${updated.lastName} fue actualizado correctamente.`,
            life: 3000
        });
    }

    deletePerson(person: Person): void {
        this.confirmationService.confirm({
            message: `¿Deseas eliminar el registro de ${person.firstName} ${person.lastName}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.personService.remove(person.id, this.actor);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Trabajador eliminado',
                    detail: `${person.firstName} ${person.lastName} fue eliminado del sistema.`,
                    life: 3000
                });
            }
        });
    }

    deleteSelected(): void {
        if (!this.selectedPersons?.length) {
            return;
        }

        const count = this.selectedPersons.length;
        this.confirmationService.confirm({
            message: `¿Deseas eliminar ${count} registro(s) seleccionado(s)?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const removed = this.personService.removeMany(
                    (this.selectedPersons ?? []).map((person) => person.id),
                    this.actor
                );
                this.selectedPersons = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Registros eliminados',
                    detail: `${removed} trabajador(es) eliminado(s) del sistema.`,
                    life: 3000
                });
            }
        });
    }

    exportCsv(): void {
        const header = ['Código', 'Nombres', 'Apellidos', 'Tipo de documento', 'Documento', 'Correo', 'Teléfono', 'Ciudad', 'Estado', 'Cargo', 'Estado del trabajador', 'Fecha y hora de registro'];
        const rows = this.filteredPersons().map((person) => [
            person.id,
            person.firstName,
            person.lastName,
            person.documentType,
            person.documentNumber,
            person.email,
            person.phone,
            person.city,
            person.department,
            person.type,
            person.status,
            new Date(person.createdAt).toLocaleString('es-VE')
        ]);

        const csv = [header, ...rows]
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trabajadores-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    exportExcel(): void {
        const headers = [
            'Código',
            'Nombres',
            'Apellidos',
            'Tipo de documento',
            'Documento',
            'Fecha de nacimiento',
            'Género',
            'Correo',
            'Teléfono',
            'Dirección',
            'Ciudad',
            'Departamento',
            'Cargo',
            'Estado',
            'Observaciones',
            'Fecha de registro',
            'Última actualización',
            'Registrado por'
        ];
        const rows = this.filteredPersons().map((person) => [
            person.id,
            person.firstName,
            person.lastName,
            person.documentType,
            person.documentNumber,
            person.birthDate,
            person.gender,
            person.email,
            person.phone,
            person.address,
            person.city,
            person.department,
            person.type,
            person.status,
            person.notes,
            new Date(person.createdAt).toLocaleString('es-VE'),
            new Date(person.updatedAt).toLocaleString('es-VE'),
            person.createdBy
        ]);
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
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trabajadores-${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
    }

    initials(firstName: string, lastName: string): string {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    getTypeSeverity(type: string): TagSeverity {
        switch (type) {
            case 'Analista':
                return 'info';
            case 'Asistente administrativo':
                return 'success';
            case 'Supervisor':
                return 'warn';
            case 'Director':
                return 'contrast';
            case 'Abogado':
                return 'info';
            case 'Trabajador obrero':
                return 'secondary';
            case 'Pasante':
                return 'success';
            default:
                return 'secondary';
        }
    }

    getStatusSeverity(status: string): TagSeverity {
        switch (status) {
            case 'Activo':
                return 'success';
            case 'Pendiente':
                return 'warn';
            case 'Inactivo':
                return 'danger';
            default:
                return 'info';
        }
    }
}
