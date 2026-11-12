import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { strToU8, zipSync } from 'fflate';
import { AuthService } from '@/app/services/auth.service';
import {
    AdditionalData,
    BLOOD_TYPES,
    CITIES_BY_DEPARTMENT,
    ChildData,
    DEPARTMENTS,
    DISABILITY_GRADES,
    DISABILITY_TYPES,
    DOCUMENT_TYPES,
    FamilyData,
    GENDERS,
    HousingData,
    HOUSING_CONDITIONS,
    HOUSING_TYPES,
    JACKET_SIZES,
    LATERALITY_OPTIONS,
    MARITAL_STATUSES,
    MedicalData,
    MILITARY_REGISTRATION_OPTIONS,
    NewPersonInput,
    PANTS_SIZES,
    Person,
    PERSON_STATUSES,
    PERSON_TYPES,
    SHIRT_SIZES,
    SHOE_SIZES,
    TagSeverity,
    VACATION_STATUSES,
    VacationData
} from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';
import { validateAcademicCompletionYear, validateAcademicInstitution, validateBirthDate, validateCedula, validateChildBirthDate, validateDocument, validatePersonName, validatePhone } from '@/app/services/validators';

@Component({
    selector: 'app-personas',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DatePickerModule,
        RippleModule,
        ToastModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        SelectModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        TabsModule,
        CheckboxModule
    ],
    providers: [MessageService],
    templateUrl: './personas.html'
})
export class Personas {
    private readonly personService = inject(PersonService);

    private readonly auth = inject(AuthService);

    private readonly messageService = inject(MessageService);

    readonly persons = this.personService.persons;

    readonly stats = this.personService.stats;

    searchTerm = signal('');

    filterType = signal<string | null>(null);

    filterStatus = signal<string | null>(null);

    readonly filteredPersons = computed(() =>
        this.persons().filter((person) => {
            const matchesType = !this.filterType() || person.type === this.filterType();
            const matchesStatus = !this.filterStatus() || person.status === this.filterStatus();

            if (!matchesType || !matchesStatus) {
                return false;
            }

            const rawSearch = this.searchTerm().trim();
            if (!rawSearch) {
                return true;
            }

            // Búsqueda estricta por cédula: la cédula debe COMENZAR por los dígitos o formato ingresado
            const searchDigits = rawSearch.replace(/\D/g, '');
            const docDigits = (person.documentNumber ?? '').replace(/\D/g, '');
            const searchNormalized = this.normalizeSearchText(rawSearch);
            const docNormalized = this.normalizeSearchText(person.documentNumber ?? '');

            const matchesDoc =
                searchDigits.length > 0 &&
                (docDigits.startsWith(searchDigits) || docNormalized.startsWith(searchNormalized));

            if (matchesDoc) {
                return true;
            }

            // Búsqueda estricta por nombre y apellido: excluye teléfono y todos los demás campos
            const personFullName = this.normalizeSearchWords(`${person.firstName ?? ''} ${person.lastName ?? ''}`);
            const searchWords = this.normalizeSearchWords(rawSearch).split(' ').filter(Boolean);

            const matchesName =
                searchWords.length > 0 && searchWords.every((word) => personFullName.includes(word));

            return matchesName;
        })
    );

    readonly typeOptions = PERSON_TYPES.map((value) => ({ label: value, value }));

    readonly statusOptions = PERSON_STATUSES.map((value) => ({ label: value, value }));

    readonly documentTypeOptions = DOCUMENT_TYPES.map((value) => ({ label: value, value }));

    readonly genderOptions = GENDERS.map((value) => ({ label: value, value }));

    readonly departmentOptions = DEPARTMENTS.map((value) => ({ label: value, value }));

    get cityOptions(): { label: string; value: string }[] {
        return [
            ...(CITIES_BY_DEPARTMENT[this.person.department] ?? []).map((value) => ({ label: value, value })),
            { label: 'Otro', value: 'Otro' }
        ];
    }

    readonly maritalStatusOptions = MARITAL_STATUSES.map((value) => ({ label: value, value }));

    readonly vacationStatusOptions = VACATION_STATUSES.map((value) => ({ label: value, value }));

    readonly bloodTypeOptions = BLOOD_TYPES.map((value) => ({ label: value, value }));

    readonly lateralityOptions = LATERALITY_OPTIONS.map((value) => ({ label: value, value }));

    readonly disabilityTypeOptions = DISABILITY_TYPES.map((value) => ({ label: value, value }));

    readonly disabilityGradeOptions = DISABILITY_GRADES.map((value) => ({ label: value, value }));

    readonly militaryRegistrationOptions = MILITARY_REGISTRATION_OPTIONS.map((value) => ({ label: value, value }));

    readonly shirtSizeOptions = SHIRT_SIZES.map((value) => ({ label: value, value }));

    readonly pantsSizeOptions = PANTS_SIZES.map((value) => ({ label: value, value }));

    readonly shoeSizeOptions = SHOE_SIZES.map((value) => ({ label: value, value }));

    readonly jacketSizeOptions = JACKET_SIZES.map((value) => ({ label: value, value }));

    // Academic data options
    readonly academicLevelOptions = [
        { label: 'Primario', value: 'Primario' },
        { label: 'Secundario', value: 'Secundario' },
        { label: 'Técnico', value: 'Técnico' },
        { label: 'Universitario', value: 'Universitario' },
        { label: 'Postgrado', value: 'Postgrado' }
    ];
    readonly yesNoOptions = [
        { label: 'Sí', value: true },
        { label: 'No', value: false }
    ];
    readonly continueStudyOptions = [
        { label: 'Sí', value: 'Sí' },
        { label: 'No', value: 'No' }
    ];
    readonly studyOptionList = [
        { label: 'Bachillerato', value: 'Bachillerato' },
        { label: 'Licenciatura', value: 'Licenciatura' },
        { label: 'Maestría', value: 'Maestría' },
        { label: 'Doctorado', value: 'Doctorado' }
    ];

    readonly housingTypeOptions = HOUSING_TYPES.map((value) => ({ label: value, value }));

    readonly housingConditionOptions = HOUSING_CONDITIONS.map((value) => ({ label: value, value }));

    activeEditTab = '0';

    personDialog = false;

    viewMode = false;

    person: Person = this.emptyPerson();

    birthDatePicker: Date | null = null;

    childBirthDatePickers: (Date | null)[] = [];

    vacationStartPicker: Date | null = null;

    vacationEndPicker: Date | null = null;

    readonly todayDate = this.startOfDay(new Date());

    readonly minBirthDate = this.startOfDay(new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate()));

    citySelection = '';

    submitted = false;

    private readonly touchedFields = new Set<string>();

    private readonly notifiedValidationErrors = new Map<string, string>();

    statusDialog = false;

    pendingStatusPerson: Person | null = null;

    inactivationReason = '';

    inactivationReasonError = '';

    private get actor(): string {
        return this.auth.currentUser()?.fullName ?? 'Sistema';
    }

    private normalizeSearchText(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    }

    private normalizeSearchWords(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    editPerson(person: Person): void {
        this.viewMode = false;
        this.openPersonDialog(person);
    }

    viewPerson(person: Person): void {
        this.viewMode = true;
        this.openPersonDialog(person);
    }

    private openPersonDialog(person: Person): void {
        this.person = {
            ...person,
            familyData: person.familyData ? { ...person.familyData, children: person.familyData.children ? [...person.familyData.children.map(c => ({ ...c }))] : [] } : this.emptyFamilyData(),
            vacationData: person.vacationData ? { ...person.vacationData } : this.emptyVacationData(),
            medicalData: person.medicalData ? { ...person.medicalData } : this.emptyMedicalData(),
            housingData: person.housingData ? { ...person.housingData } : this.emptyHousingData(),
            additionalData: person.additionalData ? { ...person.additionalData } : this.emptyAdditionalData(),
            academicData: {
                academicLevel: '',
                specialty: '',
                graduated: false,
                university: '',
                continueStudies: '',
                studyOptions: '',
                wantsToFacilitate: false,
                ...person.academicData,
                completionYear: String(person.academicData?.completionYear ?? '')
            }
        };
        this.birthDatePicker = this.fromStoredDate(this.person.birthDate);
        this.childBirthDatePickers = (this.person.familyData?.children ?? []).map((child) => this.fromStoredDate(child.birthDate));
        this.vacationStartPicker = this.fromStoredDate(this.person.vacationData?.lastVacationStart);
        this.vacationEndPicker = this.fromStoredDate(this.person.vacationData?.lastVacationEnd);
        this.citySelection = (CITIES_BY_DEPARTMENT[this.person.department] ?? []).includes(this.person.city)
            ? this.person.city
            : this.person.city
              ? 'Otro'
              : '';
        this.submitted = false;
        this.clearValidationState();
        this.activeEditTab = '0';
        this.personDialog = true;
    }

    hideDialog(): void {
        this.personDialog = false;
        this.viewMode = false;
        this.submitted = false;
        this.clearValidationState();
    }

    onDepartmentChange(): void {
        this.person.city = '';
        this.citySelection = '';
    }

    onCitySelectionChange(value: string): void {
        this.citySelection = value;
        this.person.city = value === 'Otro' ? '' : value;
    }

    openStatusDialog(person: Person): void {
        this.pendingStatusPerson = person;
        this.inactivationReason = '';
        this.inactivationReasonError = '';
        this.statusDialog = true;
    }

    hideStatusDialog(): void {
        this.statusDialog = false;
        this.pendingStatusPerson = null;
        this.inactivationReason = '';
        this.inactivationReasonError = '';
    }

    saveStatusChange(): void {
        const person = this.pendingStatusPerson;
        if (!person) {
            return;
        }

        if (person.status !== 'Inactivo' && !this.inactivationReason.trim()) {
            this.inactivationReasonError = 'El motivo es obligatorio para inhabilitar al trabajador.';
            return;
        }

        const result =
            person.status === 'Inactivo'
                ? this.personService.activate(person.id, this.actor)
                : this.personService.inactivate(person.id, this.inactivationReason, this.actor);

        this.messageService.add({
            severity: result.ok ? 'success' : 'error',
            summary: result.ok ? 'Estado actualizado' : 'No se pudo actualizar',
            detail: result.message,
            life: 3500
        });

        if (result.ok) {
            this.hideStatusDialog();
        }
    }

    private emptyFamilyData(): FamilyData {
        return { maritalStatus: MARITAL_STATUSES[0], numberOfChildren: 0, children: [] };
    }

    private emptyVacationData(): VacationData {
        return { status: VACATION_STATUSES[0] };
    }

    private emptyMedicalData(): MedicalData {
        return { hasDisability: false, hasOccupationalDisease: false, hasPathology: false };
    }

    private emptyHousingData(): HousingData {
        return { hasBasicServices: false };
    }

    private emptyAdditionalData(): AdditionalData {
        return { militaryRegistration: MILITARY_REGISTRATION_OPTIONS[1] };
    }

    private emptyPerson(): Person {
        return {
            id: '',
            firstName: '',
            lastName: '',
            documentType: DOCUMENT_TYPES[0],
            documentNumber: '',
            birthDate: '',
            gender: GENDERS[0],
            phone: '',
            address: '',
            city: '',
            department: DEPARTMENTS[0],
            type: '',
            status: PERSON_STATUSES[0],
            notes: '',
            createdAt: '',
            updatedAt: '',
            createdBy: '',
            familyData: this.emptyFamilyData(),
            vacationData: this.emptyVacationData(),
            medicalData: this.emptyMedicalData(),
            housingData: this.emptyHousingData(),
            additionalData: this.emptyAdditionalData(),
            academicData: {
                academicLevel: '',
                specialty: '',
                graduated: false,
                university: '',
                completionYear: '',
                continueStudies: '',
                studyOptions: '',
                wantsToFacilitate: false
            }
        };
    }

    addChild(): void {
        if (!this.person.familyData) {
            this.person.familyData = this.emptyFamilyData();
        }
        if (!this.person.familyData.children) {
            this.person.familyData.children = [];
        }
        this.person.familyData.children.push({ name: '', birthDate: '', documentNumber: '' });
        this.childBirthDatePickers.push(null);
        if (this.person.familyData.children.length > (this.person.familyData.numberOfChildren || 0)) {
            this.person.familyData.numberOfChildren = this.person.familyData.children.length;
        }
    }

    removeChild(index: number): void {
        this.person.familyData?.children?.splice(index, 1);
        this.childBirthDatePickers.splice(index, 1);
        this.clearChildValidationState();
        if (this.person.familyData && (this.person.familyData.children?.length ?? 0) < this.person.familyData.numberOfChildren) {
            this.person.familyData.numberOfChildren = this.person.familyData.children?.length ?? 0;
        }
    }

    trackByIndex(index: number): number {
        return index;
    }

    hasSpouseFields(): boolean {
        const status = this.person.familyData?.maritalStatus;
        const hasExistingSpouse = !!this.person.familyData?.spouseName?.trim();
        const partnerStatuses = [
            'Casado/a',
            'Unión estable',
            'Unión estable de hecho / Concubinato',
            'Separado/a',
            'Separado/a de hecho',
            'Separado/a legalmente',
            'Comprometido/a'
        ];
        return hasExistingSpouse || (!!status && partnerStatuses.includes(status));
    }

    firstNameError(): string {
        return this.submitted || this.touchedFields.has('firstName') ? (validatePersonName(this.person.firstName, 'nombres') ?? '') : '';
    }

    lastNameError(): string {
        return this.submitted || this.touchedFields.has('lastName') ? (validatePersonName(this.person.lastName, 'apellidos') ?? '') : '';
    }

    documentError(): string {
        if (!this.submitted && !this.touchedFields.has('document')) {
            return '';
        }
        return validateDocument(this.person.documentType, this.person.documentNumber) ?? '';
    }

    birthDateError(): string {
        if ((!this.submitted && !this.touchedFields.has('birthDate')) || !this.person.birthDate) {
            return '';
        }
        return validateBirthDate(this.person.birthDate) ?? '';
    }

    childNameError(index: number): string {
        const child = this.person.familyData?.children?.[index];
        if (!child || (!this.submitted && !this.touchedFields.has(`childName:${index}`))) {
            return '';
        }
        return validatePersonName(child.name, 'nombre del hijo/a') ?? '';
    }

    childBirthDateError(index: number): string {
        const child = this.person.familyData?.children?.[index];
        if (!child || (!this.submitted && !this.touchedFields.has(`childBirthDate:${index}`))) {
            return '';
        }
        return validateChildBirthDate(child.birthDate) ?? '';
    }

    universityError(): string {
        return this.submitted || this.touchedFields.has('university') ? (validateAcademicInstitution(this.person.academicData?.university ?? '') ?? '') : '';
    }

    completionYearError(): string {
        return this.submitted || this.touchedFields.has('completionYear') ? (validateAcademicCompletionYear(this.person.academicData?.completionYear ?? '') ?? '') : '';
    }

    phoneError(): string {
        if ((!this.submitted && !this.touchedFields.has('phone')) || !this.person.phone) {
            return '';
        }
        return validatePhone(this.person.phone) ?? '';
    }

    optionalCedulaError(field: string, value: string | undefined): string {
        if ((!this.submitted && !this.touchedFields.has(field)) || !value?.trim()) {
            return '';
        }
        return validateCedula(value) ?? '';
    }

    optionalPhoneError(field: string, value: string | undefined): string {
        if ((!this.submitted && !this.touchedFields.has(field)) || !value?.trim()) {
            return '';
        }
        return validatePhone(value) ?? '';
    }

    onFirstNameChange(): void {
        this.validateNameOnChange('firstName', this.person.firstName, 'nombres');
    }

    onLastNameChange(): void {
        this.validateNameOnChange('lastName', this.person.lastName, 'apellidos');
    }

    onDocumentTypeChange(): void {
        this.validateDocumentOnChange();
    }

    onDocumentNumberChange(): void {
        this.validateDocumentOnChange();
    }

    onPhoneChange(): void {
        this.touchedFields.add('phone');
        this.notifyValidationError('phone', this.person.phone ? validatePhone(this.person.phone) : null, 'Teléfono inválido');
    }

    onOptionalCedulaChange(field: string, value: string | undefined): void {
        this.touchedFields.add(field);
        this.notifyValidationError(field, value?.trim() ? validateCedula(value) : null, 'Cédula inválida');
    }

    onOptionalPhoneChange(field: string, value: string | undefined): void {
        this.touchedFields.add(field);
        this.notifyValidationError(field, value?.trim() ? validatePhone(value) : null, 'Teléfono inválido');
    }

    onBirthDateChange(): void {
        this.touchedFields.add('birthDate');
        this.notifyValidationError('birthDate', this.person.birthDate ? validateBirthDate(this.person.birthDate) : null, 'Fecha de nacimiento inválida');
    }

    onBirthDatePickerChange(value: Date | null): void {
        this.person.birthDate = this.toStoredDate(value);
        this.onBirthDateChange();
    }

    onChildNameChange(index: number): void {
        this.touchedFields.add(`childName:${index}`);
        const child = this.person.familyData?.children?.[index];
        this.notifyValidationError(`childName:${index}`, child ? validatePersonName(child.name, 'nombre del hijo/a') : null, 'Nombre del hijo/a inválido');
    }

    onChildBirthDateChange(index: number): void {
        this.touchedFields.add(`childBirthDate:${index}`);
        const child = this.person.familyData?.children?.[index];
        this.notifyValidationError(`childBirthDate:${index}`, child ? validateChildBirthDate(child.birthDate) : null, 'Fecha de nacimiento del hijo/a inválida');
    }

    onChildBirthDatePickerChange(index: number, value: Date | null): void {
        const child = this.person.familyData?.children?.[index];
        if (child) {
            child.birthDate = this.toStoredDate(value);
        }
        this.onChildBirthDateChange(index);
    }

    onVacationStartChange(value: Date | null): void {
        if (this.person.vacationData) {
            this.person.vacationData.lastVacationStart = this.toStoredDate(value);
        }
    }

    onVacationEndChange(value: Date | null): void {
        if (this.person.vacationData) {
            this.person.vacationData.lastVacationEnd = this.toStoredDate(value);
        }
    }

    onCompletionYearChange(): void {
        this.touchedFields.add('completionYear');
        this.notifyValidationError('completionYear', validateAcademicCompletionYear(this.person.academicData?.completionYear ?? ''), 'Año de culminación inválido');
    }

    private validateNameOnChange(field: 'firstName' | 'lastName', value: string, label: string): void {
        this.touchedFields.add(field);
        const error = validatePersonName(value, label);
        this.notifyValidationError(field, error, `${label.charAt(0).toUpperCase()}${label.slice(1)} inválidos`);
    }

    private validateDocumentOnChange(): void {
        this.touchedFields.add('document');
        this.notifyValidationError('document', validateDocument(this.person.documentType, this.person.documentNumber), 'Documento inválido');
    }

    private notifyValidationError(field: string, error: string | null, summary: string): void {
        if (!error) {
            this.notifiedValidationErrors.delete(field);
            return;
        }
        if (this.notifiedValidationErrors.get(field) === error) {
            return;
        }
        this.notifiedValidationErrors.set(field, error);
        this.messageService.add({ severity: 'error', summary, detail: error, life: 4000 });
    }

    private clearValidationState(): void {
        this.touchedFields.clear();
        this.notifiedValidationErrors.clear();
    }

    private clearChildValidationState(): void {
        for (const field of this.touchedFields) {
            if (field.startsWith('childName:') || field.startsWith('childBirthDate:')) {
                this.touchedFields.delete(field);
            }
        }
        for (const field of this.notifiedValidationErrors.keys()) {
            if (field.startsWith('childName:') || field.startsWith('childBirthDate:')) {
                this.notifiedValidationErrors.delete(field);
            }
        }
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

    savePerson(): void {
        this.submitted = true;

        if (!this.person.firstName?.trim() || !this.person.lastName?.trim() || !this.person.documentNumber?.trim() || !this.person.type?.trim()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Formulario incompleto',
                detail: 'Completa los campos obligatorios para guardar los cambios.',
                life: 3500
            });
            return;
        }

        const nameErr = validatePersonName(this.person.firstName, 'nombres');
        if (nameErr) {
            this.messageService.add({
                severity: 'error',
                summary: 'Nombres inválidos',
                detail: nameErr,
                life: 3500
            });
            return;
        }

        const lastNameErr = validatePersonName(this.person.lastName, 'apellidos');
        if (lastNameErr) {
            this.messageService.add({
                severity: 'error',
                summary: 'Apellidos inválidos',
                detail: lastNameErr,
                life: 3500
            });
            return;
        }

        const docErr = validateDocument(this.person.documentType, this.person.documentNumber);
        if (docErr) {
            this.messageService.add({
                severity: 'error',
                summary: 'Documento inválido',
                detail: docErr,
                life: 4000
            });
            return;
        }

        const spouseCedula = this.person.familyData?.spouseDocumentNumber?.trim();
        if (spouseCedula) {
            const spouseCedulaError = validateCedula(spouseCedula);
            if (spouseCedulaError) {
                this.activeEditTab = '1';
                this.messageService.add({ severity: 'error', summary: 'Cédula del cónyuge inválida', detail: spouseCedulaError, life: 4000 });
                return;
            }
        }

        const spousePhone = this.person.familyData?.spousePhone?.trim();
        if (spousePhone) {
            const spousePhoneError = validatePhone(spousePhone);
            if (spousePhoneError) {
                this.activeEditTab = '1';
                this.messageService.add({ severity: 'error', summary: 'Teléfono del cónyuge inválido', detail: spousePhoneError, life: 4000 });
                return;
            }
        }

        if (this.person.birthDate) {
            const birthErr = validateBirthDate(this.person.birthDate);
            if (birthErr) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Fecha inválida',
                    detail: birthErr,
                    life: 4000
                });
                return;
            }
        }

        for (const child of this.person.familyData?.children ?? []) {
            const childNameErr = validatePersonName(child.name, 'nombre del hijo/a');
            if (childNameErr) {
                this.activeEditTab = '1';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Nombre del hijo/a inválido',
                    detail: childNameErr,
                    life: 4000
                });
                return;
            }

            const childBirthDateErr = validateChildBirthDate(child.birthDate);
            if (childBirthDateErr) {
                this.activeEditTab = '1';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Fecha de nacimiento del hijo/a inválida',
                    detail: childBirthDateErr,
                    life: 4000
                });
                return;
            }

            if (child.documentNumber?.trim()) {
                const childCedulaErr = validateCedula(child.documentNumber);
                if (childCedulaErr) {
                    this.activeEditTab = '1';
                    this.messageService.add({ severity: 'error', summary: 'Cédula del hijo/a inválida', detail: childCedulaErr, life: 4000 });
                    return;
                }
            }
        }

        const universityErr = validateAcademicInstitution(this.person.academicData?.university ?? '');
        if (universityErr) {
            this.activeEditTab = '6';
            this.messageService.add({
                severity: 'error',
                summary: 'Universidad inválida',
                detail: universityErr,
                life: 4000
            });
            return;
        }

        const completionYearErr = validateAcademicCompletionYear(this.person.academicData?.completionYear ?? '');
        if (completionYearErr) {
            this.activeEditTab = '6';
            this.messageService.add({
                severity: 'error',
                summary: 'Año de culminación inválido',
                detail: completionYearErr,
                life: 4000
            });
            return;
        }

        if (this.person.phone) {
            const phoneErr = validatePhone(this.person.phone);
            if (phoneErr) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Teléfono inválido',
                    detail: phoneErr,
                    life: 4000
                });
                return;
            }
        }

        const emergencyPhone = this.person.medicalData?.emergencyContactPhone?.trim();
        if (emergencyPhone) {
            const emergencyPhoneError = validatePhone(emergencyPhone);
            if (emergencyPhoneError) {
                this.activeEditTab = '3';
                this.messageService.add({ severity: 'error', summary: 'Teléfono de emergencia inválido', detail: emergencyPhoneError, life: 4000 });
                return;
            }
        }

        if (this.personService.documentExists(this.person.documentNumber, this.person.id)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Documento duplicado',
                detail: 'Ya existe otro trabajador registrado con ese número de documento.',
                life: 4000
            });
            return;
        }

        const input: NewPersonInput = {
            firstName: this.person.firstName,
            lastName: this.person.lastName,
            documentType: this.person.documentType,
            documentNumber: this.person.documentNumber,
            birthDate: this.person.birthDate,
            gender: this.person.gender,
            phone: this.person.phone,
            address: this.person.address,
            city: this.person.city,
            department: this.person.department,
            type: this.person.type,
            status: this.person.status,
            notes: this.person.notes,
            familyData: this.person.familyData,
            vacationData: this.person.vacationData,
            medicalData: this.person.medicalData,
            housingData: this.person.housingData,
            additionalData: this.person.additionalData,
            academicData: this.person.academicData
        };

        const updated = this.personService.update(this.person.id, input, this.actor);

        if (!updated) {
            this.messageService.add({
                severity: 'error',
                summary: 'No se pudo guardar',
                detail: 'El trabajador ya no existe en el sistema.',
                life: 3500
            });
            return;
        }

        this.personDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Trabajador actualizado',
            detail: `${updated.firstName} ${updated.lastName} fue actualizado correctamente.`,
            life: 3000
        });
    }

    exportCsv(): void {
        const header = ['Código', 'Nombres', 'Apellidos', 'Tipo de documento', 'Documento', 'Teléfono', 'Ciudad', 'Estado', 'Cargo', 'Estado del trabajador', 'Última actualización'];
        const rows = this.filteredPersons().map((person) => [
            person.id,
            person.firstName,
            person.lastName,
            person.documentType,
            person.documentNumber,
            person.phone,
            person.city,
            person.department,
            person.type,
            person.status,
            new Date(person.updatedAt || person.createdAt).toLocaleString('es-VE')
        ]);

        const csv = [header, ...rows]
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trabajadores-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    exportExcel(): void {
        const headers = [
            'Código',
            'Nombres',
            'Apellidos',
            'Tipo de documento',
            'Documento',
            'Cantidad de hijos',
            'Fecha de nacimiento',
            'Género',
            'Teléfono',
            'Dirección',
            'Ciudad',
            'Departamento',
            'Cargo',
            'Estado',
            'Observaciones',
            'Fecha de registro',
            'Última actualización',
            'Registrado por',
            'Nivel académico',
            'Especialidad',
            '¿Graduado(a)?',
            'Universidad',
            'Año de culminación (real o estimado)',
            '¿Desea continuar sus estudios?',
            'Opciones de estudio',
            '¿Desea participar como facilitador?'
        ];
        const rows = this.filteredPersons().map((person) => [
            person.id,
            person.firstName,
            person.lastName,
            person.documentType,
            person.documentNumber,
            person.familyData?.numberOfChildren ?? person.familyData?.children?.length ?? 0,
            person.birthDate,
            person.gender,
            person.phone,
            person.address,
            person.city,
            person.department,
            person.type,
            person.status,
            person.notes,
            new Date(person.createdAt).toLocaleString('es-VE'),
            new Date(person.updatedAt).toLocaleString('es-VE'),
            person.createdBy,
            person.academicData?.academicLevel ?? '',
            person.academicData?.specialty ?? '',
            person.academicData?.graduated === undefined ? '' : person.academicData.graduated ? 'Sí' : 'No',
            person.academicData?.university ?? '',
            person.academicData?.completionYear ?? '',
            person.academicData?.continueStudies ?? '',
            person.academicData?.studyOptions ?? '',
            person.academicData?.wantsToFacilitate === undefined ? '' : person.academicData.wantsToFacilitate ? 'Sí' : 'No'
        ]);
        const worksheetRows = [headers, ...rows];
        const columnName = (index: number): string => {
            let name = '';
            let current = index + 1;
            while (current > 0) {
                const remainder = (current - 1) % 26;
                name = String.fromCharCode(65 + remainder) + name;
                current = Math.floor((current - 1) / 26);
            }
            return name;
        };
        const escapeXml = (value: string): string =>
            value
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        const columns = headers
            .map((header, index) => {
                const maxLength = Math.max(header.length, ...rows.map((row) => String(row[index] ?? '').length));
                const width = Math.min(40, Math.max(12, maxLength + 2));
                return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
            })
            .join('');
        const sheetData = worksheetRows
            .map(
                (row, rowIndex) =>
                    `<row r="${rowIndex + 1}">${row
                        .map(
                            (value, columnIndex) =>
                                `<c r="${columnName(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value ?? ''))}</t></is></c>`
                        )
                        .join('')}</row>`
            )
            .join('');
        const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${columns}</cols><sheetData>${sheetData}</sheetData></worksheet>`;
        const files = {
            '[Content_Types].xml': strToU8(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'
            ),
            '_rels/.rels': strToU8(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
            ),
            'xl/workbook.xml': strToU8(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Trabajadores" sheetId="1" r:id="rId1"/></sheets></workbook>'
            ),
            'xl/_rels/workbook.xml.rels': strToU8(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'
            ),
            'xl/worksheets/sheet1.xml': strToU8(worksheetXml)
        };
        const workbook = zipSync(files);
        const blob = new Blob([workbook.slice().buffer as ArrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trabajadores-${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
    }

    initials(firstName: string, lastName: string): string {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    getTypeSeverity(type: string): TagSeverity {
        switch (type) {
            case 'Analista':
                return 'info';
            case 'Asistente administrativo':
                return 'success';
            case 'Supervisor':
                return 'warn';
            case 'Director':
                return 'contrast';
            case 'Abogado':
                return 'info';
            case 'Trabajador obrero':
                return 'secondary';
            case 'Pasante':
                return 'success';
            default:
                return 'secondary';
        }
    }

    getStatusSeverity(status: string): TagSeverity {
        switch (status) {
            case 'Activo':
                return 'success';
            case 'Pendiente':
                return 'warn';
            case 'Inactivo':
                return 'danger';
            default:
                return 'info';
        }
    }
}
