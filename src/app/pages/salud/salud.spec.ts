/// <reference types="jasmine" />
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { DOCUMENT_TYPES, FamilyMember, GENDERS } from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';
import { Salud } from './salud';

describe('Salud Component - Administración de beneficiarios', () => {
    let component: Salud;
    let fixture: ComponentFixture<Salud>;
    let personService: PersonService;
    let workerId: string;

    const baseMember = (overrides: Partial<FamilyMember> = {}): FamilyMember => ({
        hasDocument: true,
        documentType: 'V',
        documentNumber: '30123456',
        firstName: 'Andrés',
        lastName: 'Pérez',
        gender: 'Masculino',
        birthDate: '2014-06-12',
        maritalStatus: 'Soltero/a',
        relationship: 'Hijo(a)',
        personalPhoneCode: '0416',
        personalPhone: '1234567',
        email: 'andres@correo.com',
        laterality: 'Diestro',
        hasDisability: false,
        hasAllergies: false,
        adoptedOrFoster: false,
        ...overrides
    });

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            imports: [Salud],
            providers: [provideZonelessChangeDetection(), provideRouter([]), providePrimeNG()]
        });

        personService = TestBed.inject(PersonService);
        const person = personService.add(
            {
                firstName: 'Esperanza',
                lastName: 'Gómez',
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
        workerId = person.id;

        fixture = TestBed.createComponent(Salud);
        component = fixture.componentInstance;
        component.onWorkerChange(workerId);
    });

    afterEach(() => localStorage.clear());

    const currentWorker = () => personService.persons().find((person) => person.id === workerId)!;

    const seedMembers = (members: FamilyMember[]) => {
        personService.update(workerId, { ...currentWorker(), familyMembers: members }, 'Admin');
    };

    it('debe registrar un beneficiario con documento de identidad', () => {
        component.openNewBeneficiary();
        component.member = baseMember();

        component.saveBeneficiary();

        const members = currentWorker().familyMembers ?? [];
        expect(members.length).toBe(1);
        expect(members[0].firstName).toBe('Andrés');
        expect(members[0].documentType).toBe('V');
        expect(members[0].documentNumber).toBe('30123456');
        expect(members[0].certificateNumber).toBe('');
        expect(component.filteredBeneficiaries().length).toBe(1);
    });

    it('no debe registrar sin el primer nombre', () => {
        component.openNewBeneficiary();
        component.member = baseMember({ firstName: ' ' });

        component.saveBeneficiary();

        expect(currentWorker().familyMembers ?? []).toEqual([]);
    });

    it('debe exigir certificado de nacimiento cuando no tiene documento', () => {
        component.openNewBeneficiary();
        component.member = baseMember({ hasDocument: false, documentType: '', documentNumber: '', certificateNumber: ' ' });

        component.saveBeneficiary();
        expect(currentWorker().familyMembers ?? []).toEqual([]);

        component.member.certificateNumber = 'CN-2020-555';
        component.saveBeneficiary();

        const members = currentWorker().familyMembers ?? [];
        expect(members.length).toBe(1);
        expect(members[0].certificateNumber).toBe('CN-2020-555');
        expect(members[0].documentType).toBe('');
        expect(members[0].documentNumber).toBe('');
    });

    it('debe actualizar un beneficiario existente', () => {
        seedMembers([baseMember()]);
        const member = component.beneficiaries()[0];

        component.openEditBeneficiary(member);
        component.member.relationship = 'Sobrino(a)';
        component.saveBeneficiary();

        const members = currentWorker().familyMembers ?? [];
        expect(members.length).toBe(1);
        expect(members[0].relationship).toBe('Sobrino(a)');
    });

    it('debe eliminar un beneficiario con confirmación', () => {
        seedMembers([baseMember()]);
        const confirmation = fixture.debugElement.injector.get(ConfirmationService);
        spyOn(confirmation, 'confirm').and.callFake((options: any) => {
            options.accept();
            return confirmation;
        });

        component.confirmRemoveBeneficiary(component.beneficiaries()[0]);

        expect(currentWorker().familyMembers ?? []).toEqual([]);
    });

    it('debe limpiar los datos de discapacidad y alergias al desactivarlos', () => {
        component.openNewBeneficiary();
        component.member = baseMember({
            hasDisability: true,
            disabilityType: 'Visual',
            disabilityGrade: 'Leve',
            conapdisCode: 'C-123',
            hasAllergies: true,
            allergyTypes: 'Polen',
            adoptedOrFoster: true,
            courtRegistryNumber: 'T-987'
        });

        component.onDisabilityChange(false);
        component.onAllergiesChange(false);
        component.onAdoptionChange(false);

        expect(component.member.disabilityType).toBe('');
        expect(component.member.disabilityGrade).toBe('');
        expect(component.member.conapdisCode).toBe('');
        expect(component.member.allergyTypes).toBe('');
        expect(component.member.courtRegistryNumber).toBe('');
    });

    it('debe conservar estados civiles ya registrados fuera del catálogo del beneficiario', () => {
        seedMembers([baseMember({ maritalStatus: 'Unión estable de hecho / Concubinato' })]);

        component.openEditBeneficiary(component.beneficiaries()[0]);

        expect(component.maritalStatusOptions.map((option) => option.value)).toContain('Unión estable de hecho / Concubinato');
        expect(component.maritalStatusOptions.map((option) => option.value)).toContain('Soltero/a');
    });

    it('debe confirmar antes de descartar cambios sin guardar', () => {
        component.openNewBeneficiary();
        component.member.firstName = 'Camila';

        const confirmation = fixture.debugElement.injector.get(ConfirmationService);
        const confirmSpy = spyOn(confirmation, 'confirm').and.callFake((options: any) => {
            options.accept();
            return confirmation;
        });

        component.onDialogHide();

        expect(confirmSpy).toHaveBeenCalled();
        expect(component.dialogVisible).toBe(false);
    });

    it('debe rechazar un beneficiario con documento ya registrado en otro trabajador', () => {
        seedMembers([baseMember()]);
        const otherWorker = personService.add(
            {
                firstName: 'Rafael',
                lastName: 'Díaz',
                documentType: DOCUMENT_TYPES[0],
                documentNumber: 'V-15999888',
                birthDate: '1985-01-20',
                gender: GENDERS[1],
                phone: '+58 414 2222222',
                address: 'Av. Sucre',
                city: 'Caracas',
                department: 'Distrito Capital',
                type: 'Supervisor',
                status: 'Activo',
                notes: ''
            },
            'Admin'
        );

        component.onWorkerChange(otherWorker.id);
        component.openNewBeneficiary();
        component.member = baseMember({ documentNumber: 'V-30123456' });

        component.saveBeneficiary();

        const other = personService.persons().find((person) => person.id === otherWorker.id)!;
        expect(other.familyMembers ?? []).toEqual([]);
        expect(component.dialogVisible).toBe(true);
    });

    it('debe filtrar beneficiarios por nombre o documento', () => {
        seedMembers([
            baseMember(),
            baseMember({ firstName: 'María', lastName: 'Rodríguez', documentNumber: '28999888', relationship: 'Madre', maritalStatus: 'Casado/a' })
        ]);

        component.searchTerm.set('rodriguez');
        expect(component.filteredBeneficiaries().length).toBe(1);
        expect(component.filteredBeneficiaries()[0].firstName).toBe('María');

        component.searchTerm.set('30123456');
        expect(component.filteredBeneficiaries().length).toBe(1);
        expect(component.filteredBeneficiaries()[0].firstName).toBe('Andrés');
    });
});
