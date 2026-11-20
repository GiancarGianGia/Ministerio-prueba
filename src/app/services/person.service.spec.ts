import { TestBed } from '@angular/core/testing';
import { NewPersonInput, DOCUMENT_TYPES, GENDERS } from './models';
import { LogService } from './log.service';
import { PersonService } from './person.service';

function makePersonInput(overrides: Partial<NewPersonInput> = {}): NewPersonInput {
    return {
        firstName: 'Ana',
        lastName: 'García',
        documentType: DOCUMENT_TYPES[0],
        documentNumber: 'V-11111111',
        birthDate: '1990-01-01',
        gender: GENDERS[0],
        phone: '+58 412 0000000',
        address: 'Calle 1',
        city: 'Caracas',
        department: 'Distrito Capital',
        type: 'Analista',
        status: 'Activo',
        notes: '',
        ...overrides
    };
}

describe('PersonService', () => {
    let service: PersonService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(PersonService);
    });

    afterEach(() => localStorage.clear());

    it('debería crearse correctamente', () => {
        expect(service).toBeTruthy();
    });

    it('add() debe agregar una persona y retornarla con un ID asignado', () => {
        const input = makePersonInput({ documentNumber: 'V-99999001' });
        const created = service.add(input, 'Tester');
        expect(created.id).toMatch(/^PER-/);
        expect(created.firstName).toBe('Ana');
    });

    it('add() debe persistir la persona en la lista', () => {
        const before = service.persons().length;
        service.add(makePersonInput({ documentNumber: 'V-99999002' }), 'Tester');
        expect(service.persons().length).toBe(before + 1);
    });

    it('migrates stored records and removes unsupported fields', () => {
        localStorage.setItem(
            'registro.personas.v4',
            JSON.stringify([
                {
                    ...makePersonInput(),
                    status: 'Inactivo',
                    deactivationReason: 'Motivo antiguo',
                    id: 'PER-0001',
                    createdAt: '2026-01-01',
                    updatedAt: '2026-01-01',
                    createdBy: 'Tester',
                    legacyField: 'old value'
                },
                {
                    ...makePersonInput({ documentNumber: 'V-22222222', status: 'Egresado' }),
                    id: 'PER-0002',
                    createdAt: '2026-01-02',
                    updatedAt: '2026-01-02',
                    createdBy: 'Tester'
                }
            ])
        );
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({});

        const migratedService = TestBed.inject(PersonService);
        const savedPersons = JSON.parse(localStorage.getItem('registro.personas.v4') ?? '[]');

        expect(migratedService.persons().length).toBe(2);
        expect(migratedService.persons()[0].status).toBe('Egresado');
        expect(migratedService.persons()[1].status).toBe('Egresado');
        expect(migratedService.stats().egresados).toBe(2);
        expect(savedPersons[0].legacyField).toBeUndefined();
        expect(savedPersons[0].deactivationReason).toBeUndefined();
    });

    it('migra los hijos y el cónyuge heredados al grupo familiar', () => {
        localStorage.setItem(
            'registro.personas.v4',
            JSON.stringify([
                {
                    ...makePersonInput({ documentNumber: 'V-33333333' }),
                    familyData: {
                        maritalStatus: 'Casado/a',
                        numberOfChildren: 2,
                        children: [{ name: 'Luis Pérez', birthDate: '2010-05-01', documentNumber: 'V-12.345.678' }],
                        spouseName: 'Ana Torres',
                        spouseDocumentNumber: 'V-87654321',
                        spousePhone: '+58 412 0000000'
                    },
                    familyMembers: [],
                    id: 'PER-0001',
                    createdAt: '2026-01-01',
                    updatedAt: '2026-01-01',
                    createdBy: 'Tester'
                }
            ])
        );
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({});

        const migratedService = TestBed.inject(PersonService);
        const person = migratedService.persons()[0];
        const members = person.familyMembers ?? [];

        const spouse = members.find((member) => member.relationship === 'Cónyuge');
        expect(spouse?.firstName).toBe('Ana Torres');
        expect(spouse?.documentType).toBe('V');
        expect(spouse?.documentNumber).toBe('87654321');

        const child = members.find((member) => member.relationship === 'Hijo/a');
        expect(child?.firstName).toBe('Luis Pérez');
        expect(child?.documentType).toBe('V');
        expect(child?.documentNumber).toBe('12345678');
        expect(person.familyData?.numberOfChildren).toBe(2);

        const saved = JSON.parse(localStorage.getItem('registro.personas.v4') ?? '[]')[0];
        expect(saved.familyData.children).toBeUndefined();
        expect(saved.familyData.spouseName).toBeUndefined();
        expect(saved.familyData.spouseDocumentNumber).toBeUndefined();
        expect(saved.familyData.spousePhone).toBeUndefined();
    });

    it('update() con log:false no registra la actualización genérica', () => {
        const logService = TestBed.inject(LogService);
        const created = service.add(makePersonInput({ documentNumber: 'V-99999011' }), 'Tester');
        const before = logService.logs().length;

        service.update(created.id, makePersonInput({ documentNumber: 'V-99999011' }), 'Tester', { log: false });

        expect(logService.logs().length).toBe(before);
    });

    it('migra las cédulas almacenadas con puntos a formato sin puntos', () => {
        localStorage.setItem(
            'registro.personas.v4',
            JSON.stringify([
                {
                    ...makePersonInput({ documentNumber: 'V-18.745.632' }),
                    id: 'PER-0001',
                    createdAt: '2026-01-01',
                    updatedAt: '2026-01-01',
                    createdBy: 'Tester'
                }
            ])
        );
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({});

        const migratedService = TestBed.inject(PersonService);

        expect(migratedService.persons()[0].documentNumber).toBe('V-18745632');
        expect(migratedService.documentExists('V-18745632')).toBeTrue();
        expect(migratedService.documentExists('V-18.745.632')).toBeTrue();
    });

    it('documentExists() debe retornar true si el documento ya existe', () => {
        service.add(makePersonInput({ documentNumber: 'V-99999003' }), 'Tester');
        expect(service.documentExists('V-99999003')).toBeTrue();
    });

    it('documentExists() debe retornar false si el documento no existe', () => {
        expect(service.documentExists('V-00000000')).toBeFalse();
    });

    it('documentExists() debe ignorar el ID excluido (edición del mismo registro)', () => {
        const created = service.add(makePersonInput({ documentNumber: 'V-99999004' }), 'Tester');
        expect(service.documentExists('V-99999004', created.id)).toBeFalse();
    });

    it('update() debe modificar los datos de una persona existente', () => {
        const created = service.add(makePersonInput({ documentNumber: 'V-99999005' }), 'Tester');
        const updated = service.update(created.id, { ...makePersonInput({ documentNumber: 'V-99999005' }), firstName: 'Beatriz' }, 'Tester');
        expect(updated?.firstName).toBe('Beatriz');
    });

    it('update() debe permitir vaciar los campos opcionales', () => {
        const created = service.add(
            makePersonInput({
                documentNumber: 'V-99999010',
                secondName: 'María',
                birthPlace: 'Valencia',
                homePhone: '+58 212 0000000',
                email: 'ana@example.com',
                rif: 'V-11111111-1'
            }),
            'Tester'
        );

        service.update(created.id, makePersonInput({ documentNumber: 'V-99999010', secondName: '', birthPlace: '', homePhone: '', email: '', rif: '' }), 'Tester');

        const stored = service.persons().find((person) => person.id === created.id);
        expect(stored?.secondName).toBeUndefined();
        expect(stored?.birthPlace).toBeUndefined();
        expect(stored?.homePhone).toBeUndefined();
        expect(stored?.email).toBeUndefined();
        expect(stored?.rif).toBeUndefined();
    });

    it('update() debe retornar null si el ID no existe', () => {
        const result = service.update('PER-9999', makePersonInput(), 'Tester');
        expect(result).toBeNull();
    });

    it('detecta a los trabajadores egresados cargados desde los datos de ejemplo', () => {
        expect(service.persons().find((person) => person.id === 'PER-0008')?.status).toBe('Egresado');
        expect(service.stats().egresados).toBe(1);
    });

    it('stats() debe reflejar la cantidad de personas activas', () => {
        const before = service.stats().active;
        service.add(makePersonInput({ documentNumber: 'V-99999009', status: 'Activo' }), 'Tester');
        expect(service.stats().active).toBe(before + 1);
    });
});
