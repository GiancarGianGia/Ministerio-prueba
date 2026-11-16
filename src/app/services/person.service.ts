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
        const seed: NewPersonInput[] = [
            {
                firstName: 'Daniela',
                secondName: 'Alejandra',
                lastName: 'Rondón',
                secondLastName: 'Pérez',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-18745632',
                birthDate: '1988-03-14',
                gender: 'Femenino',
                phone: '+58 412-5550101',
                address: 'Av. Universidad, Esquina San Francisco, Torre Ministerial',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Director',
                status: 'Activo',
                notes: 'Dirección General de Talento Humano.',
                laborData: { titularPosition: 'Directora de Talento Humano' }
            },
            {
                firstName: 'José',
                secondName: 'Manuel',
                lastName: 'Herrera',
                secondLastName: 'Contreras',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-14238907',
                birthDate: '1982-07-22',
                gender: 'Masculino',
                phone: '+58 414-5550202',
                address: 'Parroquia Altagracia, Av. Este 2, Sede del MPPPST',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Supervisor',
                status: 'Activo',
                notes: 'Oficina de Administración y Finanzas.',
                laborData: { titularPosition: 'Supervisor de Nómina' }
            },
            {
                firstName: 'María',
                secondName: 'Gabriela',
                lastName: 'Rodríguez',
                secondLastName: 'Silva',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-20516884',
                birthDate: '1994-11-05',
                gender: 'Femenino',
                phone: '+58 424-5550303',
                address: 'Parroquia El Recreo, Av. Casanova, Torre del Trabajo',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Activo',
                notes: 'Dirección de Talento Humano.',
                laborData: { titularPosition: 'Analista de Reclutamiento y Selección' },
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
                birthDate: '1975-02-18',
                gender: 'Masculino',
                phone: '+58 416-5550404',
                address: 'Parroquia La Candelaria, Calle Real de Sabana Grande',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Trabajador obrero',
                status: 'Activo',
                notes: 'Dirección de Servicios Generales.',
                laborData: { titularPosition: 'Obrero de Mantenimiento' }
            },
            {
                firstName: 'Carmen',
                secondName: 'Teresa',
                lastName: 'Villarroel',
                secondLastName: 'Rojas',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-16432109',
                birthDate: '1986-06-30',
                gender: 'Femenino',
                phone: '+58 412-5550505',
                address: 'Parroquia San Pedro, Av. Este 4, Residencias Los Jardines',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Asistente administrativo',
                status: 'Activo',
                notes: 'Oficina de Atención al Ciudadano.',
                laborData: { titularPosition: 'Asistente Administrativo' }
            },
            {
                firstName: 'Rafael',
                secondName: 'Antonio',
                lastName: 'Suárez',
                secondLastName: 'Molina',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-9874321',
                birthDate: '1970-09-12',
                gender: 'Masculino',
                phone: '+58 414-5550606',
                address: 'Parroquia El Valle, Calle Los Jardines, Casa 12',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Pendiente',
                notes: 'Dirección de Inspección del Trabajo.',
                laborData: { titularPosition: 'Analista de Seguridad y Salud Laboral' }
            },
            {
                firstName: 'Ana',
                secondName: 'Carolina',
                lastName: 'Betancourt',
                secondLastName: 'Linares',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-22109876',
                birthDate: '1998-04-27',
                gender: 'Femenino',
                phone: '+58 424-5550707',
                address: 'Parroquia Catia, Av. Sucre, Edificio Caracas',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Pasante',
                status: 'Pendiente',
                notes: 'Dirección de Talento Humano.',
                laborData: { titularPosition: 'Pasante de Recursos Humanos' }
            },
            {
                firstName: 'Pedro',
                secondName: 'Jesús',
                lastName: 'Colmenares',
                secondLastName: 'Ávila',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-11567890',
                birthDate: '1978-12-03',
                gender: 'Masculino',
                phone: '+58 416-5550808',
                address: 'Parroquia La Vega, Carretera Vieja Caracas-Los Teques',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Abogado',
                status: 'Egresado',
                notes: 'Dirección de Consultoría Jurídica.',
                laborData: { titularPosition: 'Abogado de Consultoría Jurídica' }
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
