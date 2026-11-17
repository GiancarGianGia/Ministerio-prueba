/// <reference types="jasmine" />
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { strFromU8, unzipSync } from 'fflate';
import { DOCUMENT_TYPES, GENDERS } from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';
import { Personas } from './personas';

describe('Personas Component - Búsqueda de trabajadores', () => {
    let component: Personas;
    let personService: PersonService;
    let messageService: MessageService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            imports: [Personas],
            providers: [
                provideZonelessChangeDetection(),
                provideRouter([]),
                providePrimeNG()
            ]
        });

        personService = TestBed.inject(PersonService);

        // Limpiar y configurar trabajadores específicos para pruebas de búsqueda
        const p1 = personService.add(
            {
                firstName: 'Esperanza',
                lastName: 'Gómez',
                secondLastName: 'Valero',
                documentType: DOCUMENT_TYPES[0],
                documentNumber: 'V-77888999',
                birthDate: '1988-03-14',
                gender: GENDERS[0],
                phone: '+58 412 1111111',
                address: 'Av. Libertador',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Activo',
                notes: ''
            },
            'Admin'
        );

        // Trabajador cuyo teléfono contiene los dígitos '77888999'
        const p2 = personService.add(
            {
                firstName: 'Leonardo',
                lastName: 'Pérez',
                secondLastName: 'Silva',
                documentType: DOCUMENT_TYPES[0],
                documentNumber: 'V-24123456',
                birthDate: '1992-05-10',
                gender: GENDERS[1],
                phone: '+58 414 7788899', // Dígitos que coinciden parcialmente con la cédula de Esperanza
                address: 'Av. Urdaneta',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Supervisor',
                status: 'Activo',
                notes: ''
            },
            'Admin'
        );

        const fixture = TestBed.createComponent(Personas);
        component = fixture.componentInstance;
        messageService = fixture.debugElement.injector.get(MessageService);
    });

    afterEach(() => localStorage.clear());

    it('debe filtrar trabajadores estrictamente por cédula', () => {
        component.searchTerm.set('77888999');
        const results = component.filteredPersons();

        // Debe encontrar únicamente a Esperanza (por su cédula)
        expect(results.length).toBe(1);
        expect(results[0].firstName).toBe('Esperanza');
    });

    it('no debe incluir un trabajador cuyo teléfono coincida con los dígitos buscados', () => {
        // Buscamos '7788899' que está en el teléfono de Leonardo (0414 7788899), pero en la cédula de Esperanza (V-77888999)
        component.searchTerm.set('7788899');
        const results = component.filteredPersons();

        // Debe encontrar a Esperanza (su cédula contiene 7788899), pero NO a Leonardo (su teléfono tiene 7788899)
        expect(results.some((p) => p.firstName === 'Leonardo')).toBeFalse();
        expect(results.some((p) => p.firstName === 'Esperanza')).toBeTrue();
    });

    it('no debe retornar resultados si se busca un número de teléfono completo', () => {
        component.searchTerm.set('414 7788899');
        const results = component.filteredPersons();

        // No debe retornar a Leonardo por teléfono ni a nadie
        expect(results.length).toBe(0);
    });

    it('debe filtrar trabajadores por nombre o apellido (con y sin acentos)', () => {
        component.searchTerm.set('esperanza');
        expect(component.filteredPersons().some((p) => p.firstName === 'Esperanza')).toBeTrue();

        component.searchTerm.set('valero');
        expect(component.filteredPersons().some((p) => p.firstName === 'Esperanza')).toBeTrue();

        component.searchTerm.set('Leonardo Perez');
        expect(component.filteredPersons().some((p) => p.firstName === 'Leonardo')).toBeTrue();
    });

    it('al buscar "2", solo debe retornar cédulas que EMPIECEN por 2, no las que tengan 2 en otra posición', () => {
        component.searchTerm.set('2');
        const results = component.filteredPersons();

        // Debe incluir los que empiezan por 2 (por ejemplo V-24123456, V-20516884, V-22109876)
        expect(results.length).toBeGreaterThan(0);
        for (const person of results) {
            const digits = person.documentNumber.replace(/\D/g, '');
            expect(digits.startsWith('2')).toBeTrue();
        }

        // Cédulas como V-18745632 (termina en 2) o V-14238907 (tiene 2 en el medio) NO deben aparecer
        expect(results.some((p) => p.documentNumber === 'V-18745632')).toBeFalse();
        expect(results.some((p) => p.documentNumber === 'V-14238907')).toBeFalse();
    });

    it('al buscar "22", solo debe retornar cédulas que EMPIECEN por 22', () => {
        component.searchTerm.set('22');
        const results = component.filteredPersons();

        expect(results.length).toBeGreaterThan(0);
        for (const person of results) {
            const digits = person.documentNumber.replace(/\D/g, '');
            expect(digits.startsWith('22')).toBeTrue();
        }

        // Cédula V-24123456 o V-20516884 empiezan por 24 y 20, no por 22
        expect(results.some((p) => p.documentNumber === 'V-24123456')).toBeFalse();
        expect(results.some((p) => p.documentNumber === 'V-20516884')).toBeFalse();
        // Cédula V-22109876 sí empieza por 22
        expect(results.some((p) => p.documentNumber === 'V-22109876')).toBeTrue();
    });

    it('al buscar "10", no debe coincidir si 10 está en el medio de la cédula', () => {
        component.searchTerm.set('10');
        const results = component.filteredPersons();

        // V-22109876 tiene '10' en el medio, pero NO empieza por 10: NO debe aparecer
        expect(results.some((p) => p.documentNumber === 'V-22109876')).toBeFalse();
        // V-16432109 tiene '10' al final, NO debe aparecer
        expect(results.some((p) => p.documentNumber === 'V-16432109')).toBeFalse();
    });

    it('debe avisar inmediatamente cuando el nombre personal es inválido', () => {
        const notify = spyOn(messageService, 'add');
        component.editPerson(personService.persons()[0]);
        component.person.firstName = '123';

        component.onFirstNameChange();

        expect(component.firstNameError()).toContain('solo puede contener letras');
        expect(notify).toHaveBeenCalledWith(
            jasmine.objectContaining({
                severity: 'error',
                summary: 'Primer nombre inválido'
            })
        );
    });

    it('debe avisar inmediatamente cuando el año académico es imposible', () => {
        const notify = spyOn(messageService, 'add');
        component.editPerson(personService.persons()[0]);
        component.person.academicData!.completionYear = '1800';

        component.onCompletionYearChange();

        expect(component.completionYearError()).toContain('El año debe estar entre');
        expect(notify).toHaveBeenCalledWith(
            jasmine.objectContaining({
                severity: 'error',
                summary: 'Año de culminación inválido'
            })
        );
    });

    it('no debe guardar un trabajador si la fecha de nacimiento de un hijo es imposible', () => {
        const notify = spyOn(messageService, 'add');
        const person = personService.persons()[0];
        component.editPerson(person);
        component.person.familyData!.children = [{ name: 'Hijo válido', birthDate: '2020-02-31' }];
        component.person.familyData!.maritalStatus = 'Soltero/a';
        component.person.email = 'hijo@dominio.com';

        component.onChildBirthDateChange(0);

        expect(component.childBirthDateError(0)).toContain('fecha válida en el calendario');
        expect(notify).toHaveBeenCalledWith(
            jasmine.objectContaining({
                severity: 'error',
                summary: 'Fecha de nacimiento del hijo/a inválida'
            })
        );

        component.savePerson();

        expect(component.personDialog).toBeTrue();
        expect(component.activeEditTab).toBe('8');
        expect(personService.persons().find((item) => item.id === person.id)?.firstName).toBe(person.firstName);
    });

    it('debe guardar los cambios del trabajador', () => {
        const person = personService.persons()[0];
        component.editPerson(person);
        component.person.firstName = 'Actualizado';
        component.person.familyData!.maritalStatus = 'Soltero/a';
        component.person.email = 'persona@dominio.com';
        component.person.laborData!.administrativeState = 'Distrito Capital';
        component.person.laborData!.physicalLocation = 'Torre Ministerial, piso 3';
        component.person.laborData!.officePhoneCode = '0212';
        component.person.laborData!.officePhone = '5551234';
        component.person.housingData!.municipality = 'Libertador';
        component.person.housingData!.parish = 'El Recreo';
        component.person.housingData!.thoroughfareType = 'Avenida';
        component.person.housingData!.referencePoint = 'Frente a la plaza Bolívar';

        component.savePerson();

        expect(component.personDialog).toBeFalse();
        expect(personService.persons().find((item) => item.id === person.id)?.firstName).toBe('Actualizado');
    });

    it('debe exportar toda la información familiar en Excel', async () => {
        personService.add(
            {
                firstName: 'Cuenta',
                lastName: 'Hijos',
                documentType: DOCUMENT_TYPES[0],
                documentNumber: 'V-88888888',
                birthDate: '1988-03-14',
                gender: GENDERS[0],
                phone: '+58 412 1111111',
                address: '',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Activo',
                notes: '',
                familyData: {
                    maritalStatus: 'Soltero/a',
                    numberOfChildren: 2,
                    children: [{ name: 'Dato de hijo exportado', birthDate: '2020-01-01' }]
                }
            },
            'Admin'
        );
        component.searchTerm.set('Cuenta');

        const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:excel-test');
        spyOn(URL, 'revokeObjectURL');
        spyOn(HTMLAnchorElement.prototype, 'click');

        component.exportExcel();

        const file = createObjectUrl.calls.mostRecent().args[0];
        if (!(file instanceof Blob)) {
            throw new Error('La exportación no generó un archivo Excel.');
        }
        const workbook = unzipSync(new Uint8Array(await file.arrayBuffer()));
        const worksheet = strFromU8(workbook['xl/worksheets/sheet1.xml']);

        expect(worksheet).toContain('Cantidad de hijos');
        const rowsXml = worksheet.match(/<row r="\d+"[\s\S]*?<\/row>/g) ?? [];
        const targetRow = rowsXml.find((row) => row.includes('V-88888888'));
        if (!targetRow) {
            throw new Error('No se encontró el trabajador en la exportación.');
        }
        const rowNumber = /r="(\d+)"/.exec(targetRow)![1];
        const headerRow = /<row r="1">([\s\S]*?)<\/row>/.exec(worksheet)?.[1] ?? '';
        const column = /<c r="([A-Z]+)1" t="inlineStr"><is><t xml:space="preserve">Cantidad de hijos<\/t><\/is><\/c>/.exec(headerRow)?.[1];
        expect(column).toBeDefined();
        expect(targetRow).toContain(`<c r="${column}${rowNumber}" t="inlineStr"><is><t xml:space="preserve">2</t></is></c>`);
        expect(targetRow).toContain('Dato de hijo exportado');
        expect(worksheet).toContain('Esperanza');
    });

    it('debe exportar todos los campos del trabajador en CSV', async () => {
        personService.add(
            {
                firstName: 'Cuenta',
                lastName: 'Completa',
                documentType: DOCUMENT_TYPES[0],
                documentNumber: 'V-77777777',
                birthDate: '1990-06-10',
                gender: GENDERS[0],
                phone: '+58 414 2222222',
                address: '',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Analista',
                status: 'Activo',
                notes: '',
                familyData: {
                    maritalStatus: 'Casado/a',
                    numberOfChildren: 1,
                    children: [{ name: 'Hija en CSV', birthDate: '2018-05-01' }]
                }
            },
            'Admin'
        );
        component.searchTerm.set('Cuenta');

        const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:csv-test');
        spyOn(URL, 'revokeObjectURL');
        spyOn(HTMLAnchorElement.prototype, 'click');

        component.exportCsv();

        const file = createObjectUrl.calls.mostRecent().args[0];
        if (!(file instanceof Blob)) {
            throw new Error('La exportación no generó un archivo CSV.');
        }
        const content = await file.text();

        expect(content).toContain('"Cantidad de hijos"');
        expect(content).toContain('"Hijos registrados"');
        expect(content).toContain('"Familiares registrados"');
        expect(content).toContain('"Observaciones laborales"');
        expect(content).toContain('Hija en CSV');
        expect(content).toContain('Esperanza');
    });
});
