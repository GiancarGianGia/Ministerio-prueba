import { computed, inject, Injectable, signal } from '@angular/core';
import { NewPersonInput, nextSequentialId, Person, PERSON_TYPES, STORAGE_KEYS } from './models';
import { LogService } from './log.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class PersonService {
    private readonly storage = inject(StorageService);

    private readonly logService = inject(LogService);

    private readonly _persons = signal<Person[]>(this.storage.read<Person[]>(STORAGE_KEYS.persons, []));

    readonly persons = this._persons.asReadonly();

    readonly stats = computed(() => {
        const persons = this._persons();
        const now = new Date();

        return {
            total: persons.length,
            active: persons.filter((person) => person.status === 'Activo').length,
            pending: persons.filter((person) => person.status === 'Pendiente').length,
            thisMonth: persons.filter((person) => {
                const date = new Date(person.createdAt);
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

    remove(id: string, actor: string): boolean {
        const person = this._persons().find((item) => item.id === id);
        if (!person) {
            return false;
        }

        this._persons.update((persons) => persons.filter((item) => item.id !== id));
        this.persistPersons();
        this.logService.record('Trabajador eliminado', `${actor} eliminó el registro del trabajador ${person.firstName} ${person.lastName} (${person.id}).`, actor, person.id);

        return true;
    }

    removeMany(ids: string[], actor: string): number {
        if (!ids.length) {
            return 0;
        }

        const idsSet = new Set(ids);
        const removed = this._persons().filter((person) => idsSet.has(person.id));
        this._persons.update((persons) => persons.filter((person) => !idsSet.has(person.id)));
        this.persistPersons();

        if (removed.length) {
            this.logService.record(
                'Trabajadores eliminados',
                `${actor} eliminó ${removed.length} registro(s) de trabajadores: ${removed.map((person) => `${person.firstName} ${person.lastName}`).join(', ')}.`,
                actor
            );
        }

        return removed.length;
    }

    documentExists(documentNumber: string, excludeId?: string): boolean {
        const normalized = documentNumber.trim().toLowerCase();
        return this._persons().some((person) => person.id !== excludeId && person.documentNumber.trim().toLowerCase() === normalized);
    }

    private persistPersons(): void {
        this.storage.write(STORAGE_KEYS.persons, this._persons());
    }

    private cleanInput(input: NewPersonInput): NewPersonInput {
        return {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            documentType: input.documentType,
            documentNumber: input.documentNumber.trim(),
            birthDate: input.birthDate,
            gender: input.gender,
            email: input.email.trim().toLowerCase(),
            phone: input.phone.trim(),
            address: input.address.trim(),
            city: input.city.trim(),
            department: input.department,
            type: input.type,
            status: input.status,
            notes: input.notes.trim()
        };
    }

    private seedDemoPersons(): void {
        const seed: NewPersonInput[] = [
            {
                firstName: 'Daniela Alejandra',
                lastName: 'Rondón Pérez',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-18.745.632',
                birthDate: '1988-03-14',
                gender: 'Femenino',
                email: 'daniela.rondon@mpppst.gob.ve',
                phone: '+58 412-5550101',
                address: 'Av. Universidad, Esquina San Francisco, Torre Ministerial',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Director',
                status: 'Activo',
                notes: 'Cargo: Directora de Talento Humano · Dirección General de Talento Humano.'
            },
            {
                firstName: 'José Manuel',
                lastName: 'Herrera Contreras',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-14.238.907',
                birthDate: '1982-07-22',
                gender: 'Masculino',
                email: 'jose.herrera@mpppst.gob.ve',
                phone: '+58 414-5550202',
                address: 'Parroquia Altagracia, Av. Este 2, Sede del MPPPST',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Supervisor',
                status: 'Activo',
                notes: 'Cargo: Supervisor de Nómina · Oficina de Administración y Finanzas.'
            },
            {
                firstName: 'María Gabriela',
                lastName: 'Rodríguez Silva',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-20.516.884',
                birthDate: '1994-11-05',
                gender: 'Femenino',
                email: 'maria.rodriguez@mpppst.gob.ve',
                phone: '+58 424-5550303',
                address: 'Parroquia El Recreo, Av. Casanova, Torre del Trabajo',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Activo',
                notes: 'Cargo: Analista de Reclutamiento y Selección · Dirección de Talento Humano.'
            },
            {
                firstName: 'Luis Fernando',
                lastName: 'Marcano Díaz',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-12.903.457',
                birthDate: '1975-02-18',
                gender: 'Masculino',
                email: 'luis.marcano@mpppst.gob.ve',
                phone: '+58 416-5550404',
                address: 'Parroquia La Candelaria, Calle Real de Sabana Grande',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Trabajador obrero',
                status: 'Activo',
                notes: 'Cargo: Obrero de Mantenimiento · Dirección de Servicios Generales.'
            },
            {
                firstName: 'Carmen Teresa',
                lastName: 'Villarroel Rojas',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-16.432.109',
                birthDate: '1986-06-30',
                gender: 'Femenino',
                email: 'carmen.villarroel@mpppst.gob.ve',
                phone: '+58 412-5550505',
                address: 'Parroquia San Pedro, Av. Este 4, Residencias Los Jardines',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Asistente administrativo',
                status: 'Activo',
                notes: 'Cargo: Asistente Administrativo · Oficina de Atención al Ciudadano.'
            },
            {
                firstName: 'Rafael Antonio',
                lastName: 'Suárez Molina',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-9.874.321',
                birthDate: '1970-09-12',
                gender: 'Masculino',
                email: 'rafael.suarez@mpppst.gob.ve',
                phone: '+58 414-5550606',
                address: 'Parroquia El Valle, Calle Los Jardines, Casa 12',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Pendiente',
                notes: 'Cargo: Analista de Seguridad y Salud Laboral · Dirección de Inspección del Trabajo.'
            },
            {
                firstName: 'Ana Carolina',
                lastName: 'Betancourt Linares',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-22.109.876',
                birthDate: '1998-04-27',
                gender: 'Femenino',
                email: 'ana.betancourt@mpppst.gob.ve',
                phone: '+58 424-5550707',
                address: 'Parroquia Catia, Av. Sucre, Edificio Caracas',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Pasante',
                status: 'Pendiente',
                notes: 'Cargo: Pasante de Recursos Humanos · Dirección de Talento Humano.'
            },
            {
                firstName: 'Pedro Jesús',
                lastName: 'Colmenares Ávila',
                documentType: 'Cédula de identidad',
                documentNumber: 'V-11.567.890',
                birthDate: '1978-12-03',
                gender: 'Masculino',
                email: 'pedro.colmenares@mpppst.gob.ve',
                phone: '+58 416-5550808',
                address: 'Parroquia La Vega, Carretera Vieja Caracas-Los Teques',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Abogado',
                status: 'Inactivo',
                notes: 'Cargo: Abogado de Consultoría Jurídica · Dirección de Consultoría Jurídica.'
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
