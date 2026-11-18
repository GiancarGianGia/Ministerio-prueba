import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import {
    DISABILITY_GRADES,
    DISABILITY_TYPES,
    DOCUMENT_PREFIX_OPTIONS,
    FamilyMember,
    GENDERS,
    HOME_PHONE_CODES,
    LATERALITY_OPTIONS,
    NewPersonInput,
    PERSONAL_PHONE_CODES,
    Person
} from '@/app/services/models';
import { AuthService } from '@/app/services/auth.service';
import { LogService } from '@/app/services/log.service';
import { PersonService } from '@/app/services/person.service';
import {
    composeDocumentNumber,
    documentTypeForPrefix,
    validateChildBirthDate,
    validateDocument,
    validateEmail,
    validatePersonName
} from '@/app/services/validators';

const BENEFICIARY_MARITAL_STATUSES = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a'];

const BENEFICIARY_RELATIONSHIPS = ['Cónyuge', 'Hijo(a)', 'Madre', 'Padre', 'Nieto(a)', 'Sobrino(a)', 'Primo(a)'];

@Component({
    selector: 'app-salud',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DatePickerModule,
        DialogModule,
        SelectModule,
        InputTextModule,
        InputIconModule,
        IconFieldModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './salud.html',
    styles: [
        `
            .worker-summary {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.45rem 0.8rem;
                border-radius: 999px;
                background: #eff6ff;
                color: #1d4ed8;
                font-size: 0.8rem;
                font-weight: 600;
            }

            .beneficiary-cell {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .beneficiary-avatar {
                width: 2.2rem;
                height: 2.2rem;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                background: #eff6ff;
                color: #1d4ed8;
                font-size: 0.78rem;
                font-weight: 800;
            }

            .beneficiary-info {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                min-width: 0;
            }

            .beneficiary-info strong {
                color: #0f172a;
                font-weight: 700;
            }

            .beneficiary-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 0.3rem;
            }

            .beneficiary-actions {
                display: flex;
                align-items: center;
                gap: 0.15rem;
            }

            .salud-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.6rem;
                padding: 2.5rem 1rem;
                text-align: center;
                color: #64748b;
            }

            .salud-empty i {
                font-size: 2rem;
                color: #94a3b8;
            }

            .salud-empty h3 {
                margin: 0;
                font-size: 1rem;
                color: #0f172a;
            }

            .salud-empty p {
                margin: 0;
                max-width: 34rem;
                font-size: 0.82rem;
            }

            .section-divider {
                margin-top: 0.5rem;
                padding-top: 0.9rem;
                border-top: 1px solid #e2e8f0;
            }

            .section-divider h4 {
                margin: 0;
                font-size: 0.92rem;
                font-weight: 800;
                color: #1d4ed8;
            }
        `
    ]
})
export class Salud {
    private readonly personService = inject(PersonService);

    private readonly auth = inject(AuthService);

    private readonly messageService = inject(MessageService);

    private readonly confirmationService = inject(ConfirmationService);

    private readonly logService = inject(LogService);

    private readonly route = inject(ActivatedRoute);

    constructor() {
        const workerId = this.route.snapshot.queryParamMap.get('trabajador');
        if (workerId && this.persons().some((person) => person.id === workerId)) {
            this.selectedWorkerId.set(workerId);
        }
    }

    readonly persons = this.personService.persons;

    selectedWorkerId = signal<string | null>(null);

    searchTerm = signal('');

    readonly workerOptions = computed(() =>
        this.persons().map((person) => ({
            label: `${this.personFullName(person)} — ${person.documentNumber}`,
            value: person.id
        }))
    );

    readonly selectedPerson = computed(() => this.persons().find((person) => person.id === this.selectedWorkerId()) ?? null);

    readonly beneficiaries = computed(() => this.selectedPerson()?.familyMembers ?? []);

    readonly filteredBeneficiaries = computed(() => {
        const term = this.normalize(this.searchTerm().trim());
        const members = this.beneficiaries();
        if (!term) {
            return members;
        }
        return members.filter((member) => this.normalize(this.memberSearchText(member)).includes(term));
    });

    readonly healthStats = computed(() => {
        const members = this.beneficiaries();
        return {
            total: members.length,
            disabilities: members.filter((member) => member.hasDisability).length,
            allergies: members.filter((member) => member.hasAllergies).length
        };
    });

    readonly yesNoOptions = [
        { label: 'Sí', value: true },
        { label: 'No', value: false }
    ];

    readonly documentTypeSelectOptions = DOCUMENT_PREFIX_OPTIONS.map(({ value, title }) => ({ label: title, value }));

    readonly genderOptions = GENDERS.map((value) => ({ label: value, value }));

    readonly personalPhoneCodeOptions = PERSONAL_PHONE_CODES.map((value) => ({ label: value, value }));

    readonly homePhoneCodeOptions = HOME_PHONE_CODES.map((value) => ({ label: value, value }));

    readonly lateralityOptions = LATERALITY_OPTIONS.map((value) => ({ label: value, value }));

    maritalStatusOptions: { label: string; value: string }[] = BENEFICIARY_MARITAL_STATUSES.map((value) => ({ label: value, value }));

    relationshipOptions: { label: string; value: string }[] = BENEFICIARY_RELATIONSHIPS.map((value) => ({ label: value, value }));

    disabilityTypeOptions: { label: string; value: string }[] = DISABILITY_TYPES.map((value) => ({ label: value, value }));

    disabilityGradeOptions: { label: string; value: string }[] = DISABILITY_GRADES.map((value) => ({ label: value, value }));

    dialogVisible = false;

    editingIndex = -1;

    member: FamilyMember = this.emptyMember();

    birthDatePicker: Date | null = null;

    private memberSnapshot = '';

    readonly todayDate = this.startOfDay(new Date());

    readonly minBirthDate = this.startOfDay(new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate()));

    private get actor(): string {
        return this.auth.currentUser()?.fullName ?? 'Sistema';
    }

    onWorkerChange(id: string | null): void {
        this.selectedWorkerId.set(id);
        this.searchTerm.set('');
        this.dialogVisible = false;
    }

    openNewBeneficiary(): void {
        if (!this.selectedPerson()) {
            this.messageService.add({ severity: 'warn', summary: 'Trabajador no seleccionado', detail: 'Selecciona un trabajador antes de agregar un beneficiario.', life: 3500 });
            return;
        }
        this.editingIndex = -1;
        this.member = this.emptyMember();
        this.birthDatePicker = null;
        this.refreshOptionLists();
        this.memberSnapshot = JSON.stringify(this.member);
        this.dialogVisible = true;
    }

    openEditBeneficiary(member: FamilyMember): void {
        this.editingIndex = this.beneficiaries().indexOf(member);
        this.member = { ...member };
        this.birthDatePicker = this.fromStoredDate(this.member.birthDate);
        this.refreshOptionLists();
        this.memberSnapshot = JSON.stringify(this.member);
        this.dialogVisible = true;
    }

    /** Intercepta el cierre nativo del diálogo (X, Escape, clic fuera) */
    onDialogHide(): void {
        if (this.hasUnsavedChanges()) {
            this.dialogVisible = true;
            this.confirmationService.confirm({
                header: 'Cambios sin guardar',
                message: 'Tienes cambios sin guardar en este beneficiario. ¿Deseas salir sin guardar?',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Salir sin guardar',
                rejectLabel: 'Seguir editando',
                acceptButtonStyleClass: 'p-button-danger',
                rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
                accept: () => this.forceCloseDialog()
            });
            return;
        }
        this.forceCloseDialog();
    }

    onHasDocumentChange(value: boolean): void {
        this.member.hasDocument = value;
        if (value) {
            this.member.certificateNumber = '';
        } else {
            this.member.documentType = '';
            this.member.documentNumber = '';
        }
    }

    onBirthDateChange(value: Date | null): void {
        this.member.birthDate = this.toStoredDate(value);
    }

    onDisabilityChange(value: boolean): void {
        this.member.hasDisability = value;
        if (!value) {
            this.member.disabilityType = '';
            this.member.disabilityGrade = '';
            this.member.conapdisCode = '';
        }
    }

    onAllergiesChange(value: boolean): void {
        this.member.hasAllergies = value;
        if (!value) {
            this.member.allergyTypes = '';
        }
    }

    onAdoptionChange(value: boolean): void {
        this.member.adoptedOrFoster = value;
        if (!value) {
            this.member.courtRegistryNumber = '';
        }
    }

    saveBeneficiary(): void {
        const person = this.selectedPerson();
        if (!person) {
            return;
        }

        const validationError = this.validateBeneficiary();
        if (validationError) {
            this.messageService.add({ severity: 'error', summary: 'Datos del beneficiario incompletos', detail: validationError, life: 4000 });
            return;
        }

        const duplicate = this.findDuplicateMember(this.member);
        if (duplicate) {
            const label = this.member.hasDocument
                ? `El documento ${composeDocumentNumber(this.member.documentType ?? '', this.member.documentNumber ?? '')}`
                : `El certificado de nacimiento ${this.member.certificateNumber?.trim()}`;
            this.messageService.add({
                severity: 'error',
                summary: 'Beneficiario duplicado',
                detail: `${label} ya está registrado a nombre de ${this.memberFullName(duplicate.member)} en el grupo familiar de ${this.personFullName(duplicate.owner)}.`,
                life: 5000
            });
            return;
        }

        const member = this.sanitizedMember();
        const members = [...(person.familyMembers ?? [])];
        const isEditing = this.editingIndex >= 0;
        if (isEditing) {
            members[this.editingIndex] = member;
        } else {
            members.push(member);
        }

        const updated = this.personService.update(person.id, this.buildInput(person, members), this.actor);
        if (!updated) {
            this.messageService.add({ severity: 'error', summary: 'No se pudo guardar', detail: 'El trabajador ya no existe en el sistema.', life: 3500 });
            return;
        }

        this.logService.record(
            isEditing ? 'Beneficiario actualizado' : 'Beneficiario agregado',
            `${this.actor} ${isEditing ? 'actualizó' : 'agregó'} al beneficiario ${this.memberFullName(member)} del grupo familiar de ${this.personFullName(person)} (${person.id}).`,
            this.actor,
            person.id
        );

        this.messageService.add({
            severity: 'success',
            summary: isEditing ? 'Beneficiario actualizado' : 'Beneficiario agregado',
            detail: `${this.memberFullName(member)} fue ${isEditing ? 'actualizado' : 'registrado'} correctamente.`,
            life: 3500
        });
        this.forceCloseDialog();
    }

    confirmRemoveBeneficiary(member: FamilyMember): void {
        const person = this.selectedPerson();
        if (!person) {
            return;
        }
        this.confirmationService.confirm({
            header: 'Eliminar beneficiario',
            message: `¿Deseas eliminar a ${this.memberFullName(member)} del grupo familiar de ${this.personFullName(person)}?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
            accept: () => this.removeBeneficiary(member, person)
        });
    }

    personFullName(person: Person): string {
        return [person.firstName, person.secondName, person.lastName, person.secondLastName].filter(Boolean).join(' ');
    }

    memberFullName(member: FamilyMember): string {
        return [member.firstName, member.secondName, member.lastName, member.secondLastName].filter(Boolean).join(' ') || 'Beneficiario sin nombre';
    }

    memberDocument(member: FamilyMember): string {
        if (!member.hasDocument) {
            return member.certificateNumber?.trim() ? `Cert. ${member.certificateNumber.trim()}` : 'Sin documento';
        }
        return member.documentType && member.documentNumber ? composeDocumentNumber(member.documentType, member.documentNumber) : 'Sin documento';
    }

    memberAge(member: FamilyMember): number | null {
        const date = this.fromStoredDate(member.birthDate);
        if (!date) {
            return null;
        }
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        if (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) {
            age--;
        }
        return age;
    }

    memberInitials(member: FamilyMember): string {
        return `${member.firstName?.charAt(0) ?? ''}${member.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'B';
    }

    private removeBeneficiary(member: FamilyMember, person: Person): void {
        const members = (person.familyMembers ?? []).filter((current) => current !== member);
        const updated = this.personService.update(person.id, this.buildInput(person, members), this.actor);
        if (!updated) {
            this.messageService.add({ severity: 'error', summary: 'No se pudo eliminar', detail: 'El trabajador ya no existe en el sistema.', life: 3500 });
            return;
        }
        this.logService.record(
            'Beneficiario eliminado',
            `${this.actor} eliminó al beneficiario ${this.memberFullName(member)} del grupo familiar de ${this.personFullName(person)} (${person.id}).`,
            this.actor,
            person.id
        );
        this.messageService.add({ severity: 'success', summary: 'Beneficiario eliminado', detail: `${this.memberFullName(member)} fue eliminado del grupo familiar.`, life: 3500 });
    }

    private validateBeneficiary(): string | null {
        const member = this.member;

        if (!member.firstName?.trim()) {
            return 'Escribe el primer nombre del beneficiario.';
        }
        const firstNameError = validatePersonName(member.firstName, 'primer nombre');
        if (firstNameError) {
            return firstNameError;
        }
        const secondNameError = member.secondName?.trim() ? validatePersonName(member.secondName, 'segundo nombre') : null;
        if (secondNameError) {
            return secondNameError;
        }
        if (!member.lastName?.trim()) {
            return 'Escribe el primer apellido del beneficiario.';
        }
        const lastNameError = validatePersonName(member.lastName, 'primer apellido');
        if (lastNameError) {
            return lastNameError;
        }
        const secondLastNameError = member.secondLastName?.trim() ? validatePersonName(member.secondLastName, 'segundo apellido') : null;
        if (secondLastNameError) {
            return secondLastNameError;
        }

        if (member.hasDocument) {
            if (!member.documentType) {
                return 'Selecciona el tipo de documento del beneficiario.';
            }
            if (!member.documentNumber?.trim()) {
                return 'Escribe el número de documento del beneficiario.';
            }
            const documentError = validateDocument(
                documentTypeForPrefix(member.documentType),
                composeDocumentNumber(member.documentType, member.documentNumber)
            );
            if (documentError) {
                return documentError;
            }
        } else if (!member.certificateNumber?.trim()) {
            return 'Escribe el número de certificado de nacimiento del beneficiario.';
        }

        if (!member.gender) {
            return 'Selecciona el sexo del beneficiario.';
        }
        if (!member.birthDate) {
            return 'Selecciona la fecha de nacimiento del beneficiario.';
        }
        const birthDateError = validateChildBirthDate(member.birthDate);
        if (birthDateError) {
            return birthDateError;
        }
        if (!member.maritalStatus) {
            return 'Selecciona el estado civil del beneficiario.';
        }
        if (!member.relationship) {
            return 'Selecciona el parentesco del beneficiario.';
        }

        const personalPhone = (member.personalPhone ?? '').replace(/\D/g, '');
        if (!member.personalPhoneCode || !/^\d{7}$/.test(personalPhone)) {
            return 'Completa el teléfono personal del beneficiario (código y 7 dígitos).';
        }
        const homePhone = (member.homePhone ?? '').replace(/\D/g, '');
        if (member.homePhoneCode || homePhone) {
            if (!member.homePhoneCode) {
                return 'Selecciona el código de área del teléfono de habitación del beneficiario.';
            }
            if (!/^\d{7}$/.test(homePhone)) {
                return 'Escribe el número local de 7 dígitos del teléfono de habitación del beneficiario.';
            }
        }

        if (!member.email?.trim()) {
            return 'Escribe el correo electrónico personal del beneficiario.';
        }
        const emailError = validateEmail(member.email);
        if (emailError) {
            return emailError;
        }
        if (!member.laterality) {
            return 'Selecciona la lateralidad del beneficiario.';
        }

        return null;
    }

    private findDuplicateMember(candidate: FamilyMember): { owner: Person; member: FamilyMember } | null {
        const documentKey = candidate.hasDocument && candidate.documentNumber?.trim()
            ? this.documentKey(candidate)
            : '';
        const certificateKey = !candidate.hasDocument ? this.certificateKey(candidate.certificateNumber) : '';
        if (!documentKey && !certificateKey) {
            return null;
        }

        for (const person of this.persons()) {
            for (const [index, member] of (person.familyMembers ?? []).entries()) {
                if (person.id === this.selectedWorkerId() && index === this.editingIndex) {
                    continue;
                }
                const memberDocumentKey = member.hasDocument && member.documentNumber?.trim() ? this.documentKey(member) : '';
                const memberCertificateKey = !member.hasDocument ? this.certificateKey(member.certificateNumber) : '';
                if ((documentKey && memberDocumentKey === documentKey) || (certificateKey && memberCertificateKey === certificateKey)) {
                    return { owner: person, member };
                }
            }
        }
        return null;
    }

    private documentKey(member: FamilyMember): string {
        return composeDocumentNumber(member.documentType ?? '', member.documentNumber ?? '').toUpperCase().replace(/[\s.]/g, '');
    }

    private certificateKey(value?: string): string {
        return (value ?? '').trim().toUpperCase().replace(/\s+/g, '');
    }

    private forceCloseDialog(): void {
        this.dialogVisible = false;
        this.memberSnapshot = '';
    }

    private hasUnsavedChanges(): boolean {
        return this.memberSnapshot !== '' && JSON.stringify(this.member) !== this.memberSnapshot;
    }

    private sanitizedMember(): FamilyMember {
        const member: FamilyMember = {
            ...this.member,
            firstName: this.member.firstName?.trim() ?? '',
            secondName: this.member.secondName?.trim() ?? '',
            lastName: this.member.lastName?.trim() ?? '',
            secondLastName: this.member.secondLastName?.trim() ?? '',
            documentNumber: this.member.documentNumber?.trim() ?? '',
            certificateNumber: this.member.certificateNumber?.trim() ?? '',
            personalPhone: (this.member.personalPhone ?? '').replace(/\D/g, ''),
            homePhone: (this.member.homePhone ?? '').replace(/\D/g, ''),
            email: this.member.email?.trim() ?? '',
            allergyTypes: this.member.allergyTypes?.trim() ?? '',
            observations: this.member.observations?.trim() ?? '',
            conapdisCode: this.member.conapdisCode?.trim() ?? '',
            courtRegistryNumber: this.member.courtRegistryNumber?.trim() ?? ''
        };
        if (member.hasDocument) {
            member.certificateNumber = '';
        } else {
            member.documentType = '';
            member.documentNumber = '';
        }
        if (!member.hasDisability) {
            member.disabilityType = '';
            member.disabilityGrade = '';
            member.conapdisCode = '';
        }
        if (!member.hasAllergies) {
            member.allergyTypes = '';
        }
        if (!member.adoptedOrFoster) {
            member.courtRegistryNumber = '';
        }
        if (!member.homePhoneCode) {
            member.homePhone = '';
        }
        return member;
    }

    private buildInput(person: Person, familyMembers: FamilyMember[]): NewPersonInput {
        return {
            firstName: person.firstName,
            secondName: person.secondName,
            lastName: person.lastName,
            secondLastName: person.secondLastName,
            documentType: person.documentType,
            documentNumber: person.documentNumber,
            birthPlace: person.birthPlace,
            birthDate: person.birthDate,
            gender: person.gender,
            phone: person.phone,
            homePhone: person.homePhone,
            email: person.email,
            rif: person.rif,
            address: person.address,
            city: person.city,
            department: person.department,
            type: person.type,
            status: person.status,
            notes: person.notes,
            familyData: person.familyData,
            familyMembers,
            vacationData: person.vacationData,
            medicalData: person.medicalData,
            housingData: person.housingData,
            additionalData: person.additionalData,
            laborData: person.laborData,
            academicData: person.academicData
        };
    }

    private refreshOptionLists(): void {
        this.maritalStatusOptions = this.withLegacyOptions(BENEFICIARY_MARITAL_STATUSES, this.member.maritalStatus);
        this.relationshipOptions = this.withLegacyOptions(BENEFICIARY_RELATIONSHIPS, this.member.relationship);
        this.disabilityTypeOptions = this.withLegacyOptions(DISABILITY_TYPES, this.member.disabilityType);
        this.disabilityGradeOptions = this.withLegacyOptions(DISABILITY_GRADES, this.member.disabilityGrade);
    }

    private withLegacyOptions(values: readonly string[], legacy?: string): { label: string; value: string }[] {
        const current = (legacy ?? '').trim();
        const extras = current && !values.includes(current) ? [current] : [];
        return [...extras, ...values].map((value) => ({ label: value, value }));
    }

    private emptyMember(): FamilyMember {
        return {
            hasDocument: true,
            hasDisability: false,
            hasAllergies: false,
            adoptedOrFoster: false
        };
    }

    private memberSearchText(member: FamilyMember): string {
        const document = member.hasDocument && member.documentNumber
            ? `${member.documentType ?? ''} ${composeDocumentNumber(member.documentType ?? '', member.documentNumber)} ${member.documentNumber}`
            : member.certificateNumber ?? '';
        return [member.firstName, member.secondName, member.lastName, member.secondLastName, document, member.relationship].filter(Boolean).join(' ');
    }

    private normalize(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    private startOfDay(date: Date): Date {
        date.setHours(0, 0, 0, 0);
        return date;
    }

    private fromStoredDate(value: string | undefined): Date | null {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
        if (!match) {
            return null;
        }
        const [, yearText, monthText, dayText] = match;
        const year = Number(yearText);
        const month = Number(monthText);
        const day = Number(dayText);
        const date = new Date(0);
        date.setFullYear(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
    }

    private toStoredDate(date: Date | null): string {
        if (!date) {
            return '';
        }
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
