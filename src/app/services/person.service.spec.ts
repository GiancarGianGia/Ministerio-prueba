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
        email: 'ana@test.com',
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

    it('remove() debe eliminar una persona existente y retornar true', () => {
        const created = service.add(makePersonInput({ documentNumber: 'V-99999006' }), 'Tester');
        const result = service.remove(created.id, 'Tester');
        expect(result).toBeTrue();
        expect(service.documentExists('V-99999006')).toBeFalse();
    });

    it('remove() debe retornar false si el ID no existe', () => {
        const result = service.remove('PER-INEXISTENTE', 'Tester');
        expect(result).toBeFalse();
    });

    it('removeMany() debe eliminar múltiples personas y retornar el conteo', () => {
        const p1 = service.add(makePersonInput({ documentNumber: 'V-99999007' }), 'Tester');
        const p2 = service.add(makePersonInput({ documentNumber: 'V-99999008' }), 'Tester');
        const count = service.removeMany([p1.id, p2.id], 'Tester');
        expect(count).toBe(2);
    });

    it('stats() debe reflejar la cantidad de personas activas', () => {
        const before = service.stats().active;
        service.add(makePersonInput({ documentNumber: 'V-99999009', status: 'Activo' }), 'Tester');
        expect(service.stats().active).toBe(before + 1);
    });
});
