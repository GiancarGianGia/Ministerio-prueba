import { TestBed } from '@angular/core/testing';
import { NewPersonInput, DOCUMENT_TYPES, GENDERS } from './models';
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
            'registro.personas.v2',
            JSON.stringify([{ ...makePersonInput(), id: 'PER-0001', createdAt: '2026-01-01', updatedAt: '2026-01-01', createdBy: 'Tester', legacyField: 'old value' }])
        );
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({});

        const migratedService = TestBed.inject(PersonService);
        const savedPersons = JSON.parse(localStorage.getItem('registro.personas.v2') ?? '[]');

        expect(migratedService.persons().length).toBe(1);
        expect(savedPersons[0].legacyField).toBeUndefined();
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

    it('update() debe retornar null si el ID no existe', () => {
        const result = service.update('PER-9999', makePersonInput(), 'Tester');
        expect(result).toBeNull();
    });

    it('inactivate() debe conservar al trabajador y guardar el motivo', () => {
        const created = service.add(makePersonInput({ documentNumber: 'V-99999006' }), 'Tester');
        const result = service.inactivate(created.id, 'Fin de la relación laboral', 'Tester');

        expect(result.ok).toBeTrue();
        expect(service.persons().find((person) => person.id === created.id)?.status).toBe('Inactivo');
        expect(service.persons().find((person) => person.id === created.id)?.deactivationReason).toBe('Fin de la relación laboral');
        expect(service.documentExists('V-99999006')).toBeTrue();
        const savedPersons = JSON.parse(localStorage.getItem('registro.personas.v2') ?? '[]');
        expect(savedPersons.find((person: { id: string }) => person.id === created.id).deactivationReason).toBe('Fin de la relación laboral');
    });

    it('inactivate() debe exigir un motivo', () => {
        const created = service.add(makePersonInput({ documentNumber: 'V-99999007' }), 'Tester');
        const result = service.inactivate(created.id, '  ', 'Tester');

        expect(result.ok).toBeFalse();
        expect(service.persons().find((person) => person.id === created.id)?.status).toBe('Activo');
    });

    it('inactivate() debe rechazar motivos de más de 500 caracteres', () => {
        const created = service.add(makePersonInput({ documentNumber: 'V-99999010' }), 'Tester');
        const result = service.inactivate(created.id, 'x'.repeat(501), 'Tester');

        expect(result.ok).toBeFalse();
        expect(service.persons().find((person) => person.id === created.id)?.status).toBe('Activo');
    });

    it('activate() debe volver a habilitar un trabajador inactivo', () => {
        const created = service.add(makePersonInput({ documentNumber: 'V-99999008' }), 'Tester');
        service.inactivate(created.id, 'Motivo de prueba', 'Tester');

        const result = service.activate(created.id, 'Tester');

        expect(result.ok).toBeTrue();
        expect(service.persons().find((person) => person.id === created.id)?.status).toBe('Activo');
    });

    it('stats() debe reflejar la cantidad de personas activas', () => {
        const before = service.stats().active;
        service.add(makePersonInput({ documentNumber: 'V-99999009', status: 'Activo' }), 'Tester');
        expect(service.stats().active).toBe(before + 1);
    });
});
