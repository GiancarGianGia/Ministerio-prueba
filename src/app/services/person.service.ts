import { computed, inject, Injectable, signal } from '@angular/core';
import { NewPersonInput, nextSequentialId, Person, PERSON_TYPES, STORAGE_KEYS } from './models';
import { LogService } from './log.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class PersonService {
    private readonly storage = inject(StorageService);

    private readonly logService = inject(LogService);

    private readonly _persons = signal<Person[]>(this.loadPersons());

    readonly persons = this._persons.asReadonly();

    readonly stats = computed(() => {
        const persons = this._persons();
        const now = new Date();

        return {
            total: persons.length,
            active: persons.filter((person) => person.status === 'Activo').length,
            pending: persons.filter((person) => person.status === 'Pendiente').length,
            egresados: persons.filter((person) => person.status === 'Egresado').length,
            thisMonth: persons.filter((person) => {
                const date = new Date(person.updatedAt || person.createdAt);
                return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
            }).length
        };
    });

    readonly typeSummary = computed(() =>
        PERSON_TYPES.map((type) => ({
            type,
            count: this._persons().filter((person) => person.type === type).length
        })).filter((item) => item.count > 0)
    );

    constructor() {
        if (this._persons().length === 0) {
            this.seedDemoPersons();
        } else {
            this.persistPersons();
        }
    }

    add(input: NewPersonInput, actor: string): Person {
        const now = new Date().toISOString();
        const person: Person = {
            ...this.cleanInput(input),
            id: nextSequentialId('PER', this._persons().map((item) => item.id)),
            createdAt: now,
            updatedAt: now,
            createdBy: actor || 'Sistema'
        };

        this._persons.update((persons) => [person, ...persons]);
        this.persistPersons();
        this.logService.record(
            'Trabajador registrado',
            `${person.firstName} ${person.lastName} fue registrado con el código ${person.id} (${person.type}).`,
            person.createdBy,
            person.id
        );

        return person;
    }

    update(id: string, input: NewPersonInput, actor: string): Person | null {
        const current = this._persons().find((person) => person.id === id);
        if (!current) {
            return null;
        }

        const updated: Person = {
            ...current,
            ...this.cleanInput(input),
            updatedAt: new Date().toISOString()
        };

        this._persons.update((persons) => persons.map((person) => (person.id === id ? updated : person)));
        this.persistPersons();
        this.logService.record('Trabajador actualizado', `${actor} actualizó los datos del trabajador ${updated.firstName} ${updated.lastName} (${updated.id}).`, actor, updated.id);

        return updated;
    }

    documentExists(documentNumber: string, excludeId?: string): boolean {
        const normalized = documentNumber.trim().toLowerCase().replace(/[\s.]/g, '');
        return this._persons().some((person) => person.id !== excludeId && person.documentNumber.trim().toLowerCase().replace(/[\s.]/g, '') === normalized);
    }

    private persistPersons(): void {
        this.storage.write(STORAGE_KEYS.persons, this._persons());
    }

    private loadPersons(): Person[] {
        return this.storage.read<Partial<Person>[]>(STORAGE_KEYS.persons, []).map((person) => {
            const notes = person.notes ?? '';
            const legacyCargo = /^Cargo:\s*(.+?)\s*·\s*(.+)$/.exec(notes);
            const laborData = person.laborData
                ? { ...person.laborData }
                : legacyCargo
                  ? { titularPosition: legacyCargo[1].trim() }
                  : undefined;
            if (legacyCargo && laborData && !laborData.titularPosition) {
                laborData.titularPosition = legacyCargo[1].trim();
            }

            return {
                id: person.id ?? '',
                firstName: person.firstName ?? '',
                lastName: person.lastName ?? '',
                ...(person.secondName ? { secondName: person.secondName } : {}),
                ...(person.secondLastName ? { secondLastName: person.secondLastName } : {}),
                documentType: person.documentType ?? '',
                documentNumber: (person.documentNumber ?? '').replace(/[\s.]/g, ''),
                ...(person.birthPlace ? { birthPlace: person.birthPlace } : {}),
                birthDate: person.birthDate ?? '',
                gender: person.gender ?? '',
                phone: person.phone ?? '',
                ...(person.homePhone ? { homePhone: person.homePhone } : {}),
                ...(person.email ? { email: person.email } : {}),
                ...(person.rif ? { rif: person.rif } : {}),
                address: person.address ?? '',
                city: person.city ?? '',
                department: person.department ?? '',
                type: person.type ?? '',
                status: person.status === 'Inactivo' ? 'Egresado' : (person.status ?? 'Activo'),
                notes: legacyCargo ? legacyCargo[2].trim() : notes,
                createdAt: person.createdAt ?? '',
                updatedAt: person.updatedAt ?? '',
                createdBy: person.createdBy ?? '',
                ...(person.familyData ? { familyData: person.familyData } : {}),
                ...(person.familyMembers ? { familyMembers: person.familyMembers } : {}),
                ...(person.vacationData ? { vacationData: person.vacationData } : {}),
                ...(person.medicalData ? { medicalData: person.medicalData } : {}),
                ...(person.housingData ? { housingData: person.housingData } : {}),
                ...(person.additionalData ? { additionalData: person.additionalData } : {}),
                ...(laborData ? { laborData } : {}),
                ...(person.academicData ? { academicData: person.academicData } : {})
            };
        });
    }

    private cleanInput(input: NewPersonInput): NewPersonInput {
        return {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            ...(input.secondName?.trim() ? { secondName: input.secondName.trim() } : {}),
            ...(input.secondLastName?.trim() ? { secondLastName: input.secondLastName.trim() } : {}),
            documentType: input.documentType,
            documentNumber: input.documentNumber.trim().replace(/[\s.]/g, ''),
            ...(input.birthPlace?.trim() ? { birthPlace: input.birthPlace.trim() } : {}),
            birthDate: input.birthDate,
            gender: input.gender,
            phone: input.phone.trim(),
            ...(input.homePhone?.trim() ? { homePhone: input.homePhone.trim() } : {}),
            ...(input.email?.trim() ? { email: input.email.trim() } : {}),
            ...(input.rif?.trim() ? { rif: input.rif.trim() } : {}),
            address: input.address.trim(),
            city: input.city.trim(),
            department: input.department,
            type: input.type,
            status: input.status,
            notes: input.notes.trim(),
            ...(input.familyData ? { familyData: input.familyData } : {}),
            ...(input.familyMembers ? { familyMembers: input.familyMembers.map((member) => ({ ...member })) } : {}),
            ...(input.vacationData ? { vacationData: input.vacationData } : {}),
            ...(input.medicalData ? { medicalData: input.medicalData } : {}),
            ...(input.housingData ? { housingData: input.housingData } : {}),
            ...(input.additionalData ? { additionalData: input.additionalData } : {}),
            ...(input.laborData ? { laborData: input.laborData } : {}),
            ...(input.academicData ? { academicData: input.academicData } : {})
        };
    }

    private seedDemoPersons(): void {
        const housing = (parish: string, details: string, referencePoint: string): Person['housingData'] => ({
            municipality: 'Libertador',
            parish,
            thoroughfareType: 'Avenida',
            thoroughfareDetails: details,
            buildingType: 'Edificio',
            buildingDetails: 'Sede del MPPPST',
            referencePoint,
            housingType: 'Apartamento',
            housingCondition: 'Alquilada',
            yearsAtAddress: 5,
            numberOfRooms: 3,
            numberOfPeopleInHouse: 4,
            hasBasicServices: true,
            observations: ''
        });

        const academic = (level: string, specialty: string, university: string, completionYear: string): Person['academicData'] => ({
            academicLevel: level,
            specialty,
            graduated: true,
            university,
            completionYear,
            continueStudies: 'No',
            wantsToFacilitate: false
        });

        const medical = (laterality: string, bloodType: string, contact: string, relationship: string, phone: string): Person['medicalData'] => ({
            hasOccupationalDisease: false,
            hasDisability: false,
            hasPathology: false,
            laterality,
            bloodType,
            allergies: 'Ninguna',
            emergencyContactName: contact,
            emergencyContactPhone: phone,
            emergencyContactRelationship: relationship,
            observations: ''
        });

        const additional = (shirt: string, pants: string, shoe: string, jacket: string, military = 'No inscrito', militaryNumber = ''): Person['additionalData'] => ({
            militaryRegistration: military,
            militaryRegistrationNumber: military === 'Inscrito' ? militaryNumber : '',
            shirtSize: shirt,
            pantsSize: pants,
            shoeSize: shoe,
            jacketSize: jacket,
            observations: ''
        });

        const labor = (location: string, position: string, physical: string, office: string, payroll: string, workerType: string, entry: string, adminEntry: string): Person['laborData'] => ({
            administrativeLocation: location,
            administrativeState: 'Distrito Capital',
            physicalLocation: physical,
            officePhoneCode: '0212',
            officePhone: office,
            titularPosition: position,
            workerType,
            payrollCode: payroll,
            mpppstEntryDate: entry,
            publicAdministrationEntryDate: adminEntry,
            observations: ''
        });

        const seed: NewPersonInput[] = [
            {
                firstName: 'Daniela',
                secondName: 'Alejandra',
                lastName: 'Rondón',
                secondLastName: 'Pérez',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-18745632',
                birthPlace: 'Caracas, Distrito Capital',
                birthDate: '1988-03-14',
                gender: 'Femenino',
                phone: '+58 412-5550101',
                email: 'daniela.rondon@mpppst.gob.ve',
                address: 'Av. Universidad, Esquina San Francisco, Torre Ministerial',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Director',
                status: 'Activo',
                notes: 'Dirección General de Talento Humano.',
                familyData: { maritalStatus: 'Casado/a', numberOfChildren: 0, children: [] },
                vacationData: { status: 'Vacaciones tomadas', lastVacationStart: '2025-08-04', lastVacationEnd: '2025-08-18', pendingDays: 0, observations: '' },
                medicalData: medical('Diestro', 'O+', 'José Rondón', 'Padre', '+58 412 5550110'),
                housingData: housing('San Agustín', 'Av. Universidad, Esquina San Francisco', 'Frente a la plaza Francisco de Miranda'),
                additionalData: additional('M', '32', '38', 'M'),
                academicData: academic('Postgrado', 'Gerencia de Talento Humano', 'Universidad Central de Venezuela', '2012'),
                laborData: labor('Dirección General de Talento Humano', 'Directora de Talento Humano', 'Torre Ministerial, piso 3, oficina 3-A', '5550101', 'NOM-0001', 'Empleado fijo', '2015-03-01', '2010-01-15')
            },
            {
                firstName: 'José',
                secondName: 'Manuel',
                lastName: 'Herrera',
                secondLastName: 'Contreras',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-14238907',
                birthPlace: 'Caracas, Distrito Capital',
                birthDate: '1982-07-22',
                gender: 'Masculino',
                phone: '+58 414-5550202',
                email: 'jose.herrera@mpppst.gob.ve',
                address: 'Parroquia Altagracia, Av. Este 2, Sede del MPPPST',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Supervisor',
                status: 'Activo',
                notes: 'Oficina de Administración y Finanzas.',
                familyData: { maritalStatus: 'Casado/a', numberOfChildren: 2, children: [] },
                vacationData: { status: 'Solicitadas pendientes', pendingDays: 5, observations: 'Solicitud consignada ante Talento Humano.' },
                medicalData: medical('Diestro', 'A+', 'María Contreras', 'Madre', '+58 414 5550203'),
                housingData: housing('Altagracia', 'Av. Este 2, Sede del MPPPST', 'Diagonal a la Iglesia de Altagracia'),
                additionalData: additional('L', '34', '41', 'L', 'Inscrito', 'M-15320'),
                academicData: academic('Universitario', 'Contaduría Pública', 'Universidad Central de Venezuela', '2008'),
                laborData: labor('Oficina de Administración y Finanzas', 'Supervisor de Nómina', 'Sede del MPPPST, piso 2, oficina 2-B', '5550202', 'NOM-0002', 'Empleado fijo', '2012-06-15', '2009-02-01')
            },
            {
                firstName: 'María',
                secondName: 'Gabriela',
                lastName: 'Rodríguez',
                secondLastName: 'Silva',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-20516884',
                birthPlace: 'Valencia, Carabobo',
                birthDate: '1994-11-05',
                gender: 'Femenino',
                phone: '+58 424-5550303',
                email: 'maria.rodriguez@mpppst.gob.ve',
                address: 'Parroquia El Recreo, Av. Casanova, Torre del Trabajo',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Activo',
                notes: 'Dirección de Talento Humano.',
                familyData: { maritalStatus: 'Soltero/a', numberOfChildren: 1, children: [] },
                vacationData: { status: 'No ha tomado vacaciones', pendingDays: 15, observations: '' },
                medicalData: medical('Diestro', 'B+', 'Ana Silva', 'Madre', '+58 424 5550304'),
                housingData: housing('El Recreo', 'Av. Casanova, Torre del Trabajo', 'Frente a la estación de metro El Recreo'),
                additionalData: additional('S', '30', '37', 'S'),
                academicData: academic('Universitario', 'Psicología', 'Universidad Central de Venezuela', '2016'),
                laborData: labor('Dirección de Talento Humano', 'Analista de Reclutamiento y Selección', 'Torre del Trabajo, piso 4, oficina 4-C', '5550303', 'NOM-0003', 'Empleado fijo', '2019-09-16', '2017-01-10'),
                familyMembers: [
                    {
                        hasDocument: true,
                        documentType: 'V',
                        documentNumber: '32765432',
                        firstName: 'Diego',
                        secondName: 'Andrés',
                        lastName: 'Rodríguez',
                        secondLastName: 'Silva',
                        gender: 'Masculino',
                        birthDate: '2015-05-20',
                        maritalStatus: 'Soltero/a',
                        relationship: 'Hijo/a',
                        personalPhoneCode: '0424',
                        personalPhone: '5550311',
                        email: 'diego.rodriguez@example.com',
                        laterality: 'Diestro',
                        hasDisability: false,
                        hasAllergies: false,
                        adoptedOrFoster: false
                    }
                ]
            },
            {
                firstName: 'Luis',
                secondName: 'Fernando',
                lastName: 'Marcano',
                secondLastName: 'Díaz',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-12903457',
                birthPlace: 'Caracas, Distrito Capital',
                birthDate: '1975-02-18',
                gender: 'Masculino',
                phone: '+58 416-5550404',
                email: 'luis.marcano@mpppst.gob.ve',
                address: 'Parroquia La Candelaria, Calle Real de Sabana Grande',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Trabajador obrero',
                status: 'Activo',
                notes: 'Dirección de Servicios Generales.',
                familyData: { maritalStatus: 'Unión estable de hecho / Concubinato', numberOfChildren: 3, children: [] },
                vacationData: { status: 'Vacaciones parciales', lastVacationStart: '2025-12-15', lastVacationEnd: '2025-12-22', pendingDays: 7, observations: '' },
                medicalData: medical('Zurdo', 'O-', 'Rosa Díaz', 'Madre', '+58 416 5550405'),
                housingData: housing('La Candelaria', 'Calle Real de Sabana Grande', 'Frente al mercado de Quinta Crespo'),
                additionalData: additional('XL', '38', '43', 'XL'),
                academicData: academic('Secundario', 'Mantenimiento General', 'Liceo Andrés Bello', '1993'),
                laborData: labor('Dirección de Servicios Generales', 'Obrero de Mantenimiento', 'Galpón de Servicios Generales, planta baja', '5550404', 'NOM-0004', 'Obrero', '2005-04-11', '2005-04-11')
            },
            {
                firstName: 'Carmen',
                secondName: 'Teresa',
                lastName: 'Villarroel',
                secondLastName: 'Rojas',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-16432109',
                birthPlace: 'Maracay, Aragua',
                birthDate: '1986-06-30',
                gender: 'Femenino',
                phone: '+58 412-5550505',
                email: 'carmen.villarroel@mpppst.gob.ve',
                address: 'Parroquia San Pedro, Av. Este 4, Residencias Los Jardines',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Asistente administrativo',
                status: 'Activo',
                notes: 'Oficina de Atención al Ciudadano.',
                familyData: { maritalStatus: 'Divorciado/a', numberOfChildren: 1, children: [] },
                vacationData: { status: 'Vacaciones tomadas', lastVacationStart: '2025-07-07', lastVacationEnd: '2025-07-21', pendingDays: 0, observations: '' },
                medicalData: medical('Diestro', 'AB+', 'Pedro Rojas', 'Padre', '+58 412 5550506'),
                housingData: housing('San Pedro', 'Av. Este 4, Residencias Los Jardines', 'Al lado del Centro Comercial Los Jardines'),
                additionalData: additional('M', '30', '38', 'M'),
                academicData: academic('Técnico', 'Administración', 'Instituto Universitario de Administración', '2010'),
                laborData: labor('Oficina de Atención al Ciudadano', 'Asistente Administrativo', 'Sede del MPPPST, mezzanina, oficina 0-2', '5550505', 'NOM-0005', 'Empleado fijo', '2014-10-20', '2011-03-07')
            },
            {
                firstName: 'Rafael',
                secondName: 'Antonio',
                lastName: 'Suárez',
                secondLastName: 'Molina',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-9874321',
                birthPlace: 'Barquisimeto, Lara',
                birthDate: '1970-09-12',
                gender: 'Masculino',
                phone: '+58 414-5550606',
                email: 'rafael.suarez@mpppst.gob.ve',
                address: 'Parroquia El Valle, Calle Los Jardines, Casa 12',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Pendiente',
                notes: 'Dirección de Inspección del Trabajo.',
                familyData: { maritalStatus: 'Casado/a', numberOfChildren: 3, children: [] },
                vacationData: { status: 'No ha tomado vacaciones', pendingDays: 12, observations: '' },
                medicalData: medical('Diestro', 'A-', 'Luisa Molina', 'Madre', '+58 414 5550607'),
                housingData: housing('El Valle', 'Calle Los Jardines, Casa 12', 'Frente a la cancha deportiva de El Valle'),
                additionalData: additional('L', '36', '42', 'L', 'Exento', ''),
                academicData: academic('Universitario', 'Ingeniería de Seguridad y Salud Laboral', 'Universidad Nacional Experimental Politécnica', '2005'),
                laborData: labor('Dirección de Inspección del Trabajo', 'Analista de Seguridad y Salud Laboral', 'Sede del MPPPST, piso 1, oficina 1-D', '5550606', 'NOM-0006', 'Empleado fijo', '2008-01-14', '2006-05-02')
            },
            {
                firstName: 'Ana',
                secondName: 'Carolina',
                lastName: 'Betancourt',
                secondLastName: 'Linares',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-22109876',
                birthPlace: 'Caracas, Distrito Capital',
                birthDate: '1998-04-27',
                gender: 'Femenino',
                phone: '+58 424-5550707',
                email: 'ana.betancourt@mpppst.gob.ve',
                address: 'Parroquia Catia, Av. Sucre, Edificio Caracas',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Pasante',
                status: 'Pendiente',
                notes: 'Dirección de Talento Humano.',
                familyData: { maritalStatus: 'Soltero/a', numberOfChildren: 0, children: [] },
                vacationData: { status: 'Solicitadas pendientes', pendingDays: 3, observations: 'Pendiente de aprobación por la dirección.' },
                medicalData: medical('Diestro', 'O-', 'Elena Linares', 'Madre', '+58 424 5550708'),
                housingData: housing('Catia', 'Av. Sucre, Edificio Caracas', 'Frente a la plaza Catia'),
                additionalData: additional('S', '28', '36', 'S'),
                academicData: academic('Universitario', 'Recursos Humanos', 'Universidad Central de Venezuela', '2024'),
                laborData: labor('Dirección de Talento Humano', 'Pasante de Recursos Humanos', 'Torre del Trabajo, piso 4, oficina 4-A', '5550707', 'NOM-0007', 'Pasante', '2026-01-12', '2026-01-12')
            },
            {
                firstName: 'Pedro',
                secondName: 'Jesús',
                lastName: 'Colmenares',
                secondLastName: 'Ávila',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-11567890',
                birthPlace: 'Mérida, Mérida',
                birthDate: '1978-12-03',
                gender: 'Masculino',
                phone: '+58 416-5550808',
                email: 'pedro.colmenares@mpppst.gob.ve',
                address: 'Parroquia La Vega, Carretera Vieja Caracas-Los Teques',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Abogado',
                status: 'Egresado',
                notes: 'Dirección de Consultoría Jurídica.',
                familyData: { maritalStatus: 'Casado/a', numberOfChildren: 2, children: [] },
                vacationData: { status: 'Vacaciones tomadas', lastVacationStart: '2025-11-03', lastVacationEnd: '2025-11-17', pendingDays: 0, observations: '' },
                medicalData: medical('Diestro', 'B-', 'Marta Ávila', 'Madre', '+58 416 5550809'),
                housingData: housing('La Vega', 'Carretera Vieja Caracas-Los Teques', 'Frente a la entrada de La Vega'),
                additionalData: additional('L', '36', '42', 'L', 'Inscrito', 'M-20871'),
                academicData: academic('Postgrado', 'Derecho Laboral', 'Universidad Central de Venezuela', '2003'),
                laborData: labor('Dirección de Consultoría Jurídica', 'Abogado de Consultoría Jurídica', 'Sede del MPPPST, piso 5, oficina 5-B', '5550808', 'NOM-0008', 'Empleado fijo', '2004-02-09', '2001-08-20')
            }
        ];

        const registrationTimes: [number, number, number][] = [
            [0, 8, 15],
            [1, 9, 40],
            [2, 10, 5],
            [3, 7, 55],
            [4, 11, 20],
            [5, 14, 10],
            [6, 8, 45],
            [8, 15, 30]
        ];

        const created = seed.map((item, index) => {
            const [days, hours, minutes] = registrationTimes[index] ?? [index, 8, 0];
            const createdAt = this.demoTimestamp(days, hours, minutes);
            return {
                ...item,
                id: `PER-${String(index + 1).padStart(4, '0')}`,
                createdAt,
                updatedAt: createdAt,
                createdBy: 'Talento Humano'
            } satisfies Person;
        });

        this._persons.set(created);
        this.persistPersons();
        this.logService.record(
            'Trabajadores de ejemplo cargados',
            'Se cargaron 8 trabajadores del Ministerio del Poder Popular para el Proceso Social de Trabajo en Caracas como datos de ejemplo.',
            'Sistema'
        );
    }

    private demoTimestamp(daysAgo: number, hours: number, minutes: number): string {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setHours(hours, minutes, 0, 0);
        return date.toISOString();
    }
}
