import { TestBed } from '@angular/core/testing';
import { PersonExportService } from './person-export.service';
import { Person } from './models';

describe('PersonExportService', () => {
    let service: PersonExportService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PersonExportService);
    });

    it('debe crearse correctamente', () => {
        expect(service).toBeTruthy();
    });

    it('exportToCsv debe generar y descargar un archivo CSV', () => {
        const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-csv');
        spyOn(URL, 'revokeObjectURL');
        spyOn(HTMLAnchorElement.prototype, 'click');

        const mockPerson: Person = {
            id: 'PER-0001',
            firstName: 'Carlos',
            lastName: 'Mendoza',
            documentType: 'Cédula de identidad',
            documentNumber: 'V-12345678',
            birthDate: '1985-05-15',
            gender: 'Masculino',
            phone: '+58 412 1234567',
            address: 'Caracas',
            city: 'Caracas',
            department: 'Distrito Capital',
            type: 'Analista',
            status: 'Activo',
            notes: '',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            createdBy: 'Sistema'
        };

        service.exportToCsv([mockPerson]);

        expect(createObjectUrl).toHaveBeenCalled();
        const blob = createObjectUrl.calls.mostRecent().args[0] as Blob;
        expect(blob.type).toContain('text/csv');
    });

    it('exportToCsv debe neutralizar fórmulas ingresadas como texto', async () => {
        const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-csv');
        spyOn(URL, 'revokeObjectURL');
        spyOn(HTMLAnchorElement.prototype, 'click');

        const mockPerson: Person = {
            id: 'PER-0003',
            firstName: 'Carlos',
            lastName: 'Mendoza',
            documentType: 'Cédula de identidad',
            documentNumber: 'V-12345678',
            birthDate: '1985-05-15',
            gender: 'Masculino',
            phone: '+58 412 1234567',
            address: 'Caracas',
            city: 'Caracas',
            department: 'Distrito Capital',
            type: 'Analista',
            status: 'Activo',
            notes: '=HYPERLINK("http://example.com")',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            createdBy: 'Sistema'
        };

        service.exportToCsv([mockPerson]);

        const blob = createObjectUrl.calls.mostRecent().args[0] as Blob;
        const text = await blob.text();
        expect(text).toContain('"\'=HYPERLINK');
        expect(text).not.toContain('"=HYPERLINK');
    });

    it('exportToCsv debe derivar el cónyuge y los hijos del grupo familiar', async () => {
        const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-csv');
        spyOn(URL, 'revokeObjectURL');
        spyOn(HTMLAnchorElement.prototype, 'click');

        const mockPerson: Person = {
            id: 'PER-0004',
            firstName: 'Carlos',
            lastName: 'Mendoza',
            documentType: 'Cédula de identidad',
            documentNumber: 'V-12345678',
            birthDate: '1985-05-15',
            gender: 'Masculino',
            phone: '+58 412 1234567',
            address: 'Caracas',
            city: 'Caracas',
            department: 'Distrito Capital',
            type: 'Analista',
            status: 'Activo',
            notes: '',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            createdBy: 'Sistema',
            familyData: { maritalStatus: 'Casado/a', numberOfChildren: 1 },
            familyMembers: [
                {
                    hasDocument: true,
                    documentType: 'V',
                    documentNumber: '87654321',
                    firstName: 'Ana',
                    lastName: 'Torres',
                    relationship: 'Cónyuge',
                    hasDisability: false,
                    hasAllergies: false,
                    adoptedOrFoster: false
                },
                {
                    hasDocument: false,
                    firstName: 'Luis',
                    lastName: 'Mendoza',
                    relationship: 'Hijo/a',
                    birthDate: '2015-03-02',
                    hasDisability: false,
                    hasAllergies: false,
                    adoptedOrFoster: false
                }
            ]
        };

        service.exportToCsv([mockPerson]);

        const blob = createObjectUrl.calls.mostRecent().args[0] as Blob;
        const text = await blob.text();
        expect(text).toContain('"Ana Torres"');
        expect(text).toContain('"V-87654321"');
        expect(text).toContain('"Luis Mendoza');
        expect(text).toContain('"1"');
    });

    it('exportToExcel debe generar y descargar un archivo Excel válido', () => {
        const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-excel');
        spyOn(URL, 'revokeObjectURL');
        spyOn(HTMLAnchorElement.prototype, 'click');

        const mockPerson: Person = {
            id: 'PER-0002',
            firstName: 'María',
            lastName: 'Pérez',
            documentType: 'Cédula de identidad',
            documentNumber: 'V-87654321',
            birthDate: '1990-08-20',
            gender: 'Femenino',
            phone: '+58 414 7654321',
            address: 'Caracas',
            city: 'Caracas',
            department: 'Distrito Capital',
            type: 'Asistente administrativo',
            status: 'Activo',
            notes: '',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            createdBy: 'Sistema'
        };

        service.exportToExcel([mockPerson]);

        expect(createObjectUrl).toHaveBeenCalled();
        const blob = createObjectUrl.calls.mostRecent().args[0] as Blob;
        expect(blob.type).toContain('spreadsheetml');
    });
});
