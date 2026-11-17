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
import { PersonExportService } from '@/app/services/person-export.service';
import { AuthService } from '@/app/services/auth.service';
import {
    AdditionalData,
    ADDRESS_BUILDING_TYPES,
    ADDRESS_THOROUGHFARE_TYPES,
    ADDRESS_UNIT_TYPES,
    ADDRESS_ZONE_TYPES,
    BLOOD_TYPES,
    CITIES_BY_DEPARTMENT,
    ChildData,
    DEPARTMENTS,
    DISABILITY_GRADES,
    DISABILITY_TYPES,
    DOCUMENT_PREFIX_OPTIONS,
    FamilyData,
    FamilyMember,
    FAMILY_RELATIONSHIPS,
    GENDERS,
    HousingData,
    HOUSING_CONDITIONS,
    HOUSING_TYPES,
    JACKET_SIZES,
    LaborData,
    LATERALITY_OPTIONS,
    MARITAL_STATUSES,
    MedicalData,
    MILITARY_REGISTRATION_OPTIONS,
    MUNICIPALITIES_BY_STATE,
    NewPersonInput,
    OFFICE_PHONE_CODES,
    PANTS_SIZES,
    PARISHES_BY_MUNICIPALITY,
    Person,
    PERSONAL_PHONE_CODES,
    PERSON_STATUSES,
    PERSON_TYPES,
    SHIRT_SIZES,
    SHOE_SIZES,
    TagSeverity,
    USER_DOCUMENT_PREFIX_OPTIONS,
    VACATION_STATUSES,
    VacationData
} from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';
import {
    composeDocumentNumber,
    composePhoneNumber,
    documentTypeForPrefix,
    extractDocumentPrefix,
    prefixForDocumentType,
    splitPhoneNumber,
    stripDocumentPrefix,
    validateAcademicCompletionYear,
    validateAcademicInstitution,
    validateBirthDate,
    validateCedula,
    validateChildBirthDate,
    validateDocument,
    validateEmail,
    validatePersonName,
    validatePhone
} from '@/app/services/validators';

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

    private readonly personExportService = inject(PersonExportService);

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
            const personFullName = this.normalizeSearchWords(
                [person.firstName, person.secondName, person.lastName, person.secondLastName].filter(Boolean).join(' ')
            );
            const searchWords = this.normalizeSearchWords(rawSearch).split(' ').filter(Boolean);

            const matchesName =
                searchWords.length > 0 && searchWords.every((word) => personFullName.includes(word));

            return matchesName;
        })
    );

    private get actor(): string {
        return this.auth.currentUser()?.fullName ?? 'Sistema';
    }

    readonly typeOptions = PERSON_TYPES.map((value) => ({ label: value, value }));

    readonly statusOptions = PERSON_STATUSES.map((value) => ({ label: value, value }));

    readonly documentTypeSelectOptions = DOCUMENT_PREFIX_OPTIONS.map(({ value, title }) => ({ label: title, value }));
    readonly workerDocumentTypeOptions = DOCUMENT_PREFIX_OPTIONS.map(({ value, documentType, title }) => ({
        label: title.split(' — ')[1]?.split(' (')[0] ?? documentType,
        value
    }));

    readonly cedulaPrefixOptions = USER_DOCUMENT_PREFIX_OPTIONS;

    readonly genderOptions = GENDERS.map((value) => ({ label: value, value }));

    readonly departmentOptions = DEPARTMENTS.map((value) => ({ label: value, value }));

    get cityOptions(): { label: string; value: string }[] {
        return [
            ...(CITIES_BY_DEPARTMENT[this.person.department] ?? []).map((value) => ({ label: value, value })),
            { label: 'Otro', value: 'Otro' }
        ];
    }

    get housingMunicipalityOptions(): { label: string; value: string }[] {
        const state = this.person.department;
        return state ? (MUNICIPALITIES_BY_STATE[state] ?? []).map((value) => ({ label: value, value })) : [];
    }

    get housingParishOptions(): { label: string; value: string }[] {
        const state = this.person.department;
        const municipality = this.person.housingData?.municipality;
        const key = state && municipality ? `${state}::${municipality}` : '';
        return key ? (PARISHES_BY_MUNICIPALITY[key] ?? []).map((value) => ({ label: value, value })) : [];
    }

    readonly maritalStatusOptions = MARITAL_STATUSES.map((value) => ({ label: value, value }));

    readonly relationshipOptions = FAMILY_RELATIONSHIPS.map((value) => ({ label: value, value }));

    readonly vacationStatusOptions = VACATION_STATUSES.map((value) => ({ label: value, value }));

    readonly bloodTypeOptions = BLOOD_TYPES.map((value) => ({ label: value, value }));

    readonly lateralityOptions = LATERALITY_OPTIONS.map((value) => ({ label: value, value }));

    readonly disabilityTypeOptions = DISABILITY_TYPES.map((value) => ({ label: value, value }));

    readonly disabilityGradeOptions = DISABILITY_GRADES.map((value) => ({ label: value, value }));

    readonly militaryRegistrationOptions = MILITARY_REGISTRATION_OPTIONS.map((value) => ({ label: value, value }));

    readonly childrenCountOptions = Array.from({ length: 21 }, (_, index) => ({ label: String(index), value: index }));

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

    readonly thoroughfareTypeOptions = ADDRESS_THOROUGHFARE_TYPES;

    readonly buildingTypeOptions = ADDRESS_BUILDING_TYPES;

    readonly unitTypeOptions = ADDRESS_UNIT_TYPES;

    readonly zoneTypeOptions = ADDRESS_ZONE_TYPES;

    readonly officePhoneCodeOptions = OFFICE_PHONE_CODES.map((value) => ({ label: value, value }));

    readonly personalPhoneCodeOptions = PERSONAL_PHONE_CODES.map((value) => ({ label: value, value }));

    activeEditTab = '0';

    personDialog = false;

    viewMode = false;

    person: Person = this.emptyPerson();

    documentPrefix = '';

    personalPhoneCode = '';

    personalPhoneNumber = '';

    homePhoneCode = '';

    homePhoneNumber = '';

    spouseDocumentPrefix = '';

    childDocumentPrefixes: string[] = [];

    birthDatePicker: Date | null = null;

    childBirthDatePickers: (Date | null)[] = [];

    familyMemberBirthDatePickers: (Date | null)[] = [];

    selectedFamilyMemberIndex = -1;

    familyMemberEditing = false;

    vacationStartPicker: Date | null = null;

    vacationEndPicker: Date | null = null;

    mpppstEntryDatePicker: Date | null = null;

    publicAdminEntryDatePicker: Date | null = null;

    readonly todayDate = this.startOfDay(new Date());

    readonly minBirthDate = this.startOfDay(new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate()));

    citySelection = '';

    submitted = false;

    private readonly touchedFields = new Set<string>();

    private readonly notifiedValidationErrors = new Map<string, string>();

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
            familyMembers: (person.familyMembers ?? []).map((member) => ({ ...member })),
            vacationData: person.vacationData ? { ...person.vacationData } : this.emptyVacationData(),
            medicalData: { ...this.emptyMedicalData(), ...person.medicalData },
            housingData: person.housingData ? { ...person.housingData } : this.emptyHousingData(),
            additionalData: { ...this.emptyAdditionalData(), ...person.additionalData },
            laborData: person.laborData ? { ...person.laborData } : this.emptyLaborData(),
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
        const personalPhone = splitPhoneNumber(this.person.phone);
        this.personalPhoneCode = personalPhone.code;
        this.personalPhoneNumber = personalPhone.number;
        const homePhone = splitPhoneNumber(this.person.homePhone ?? '');
        this.homePhoneCode = homePhone.code;
        this.homePhoneNumber = homePhone.number;
        this.childBirthDatePickers = (this.person.familyData?.children ?? []).map((child) => this.fromStoredDate(child.birthDate));
        this.familyMemberBirthDatePickers = (this.person.familyMembers ?? []).map((member) => this.fromStoredDate(member.birthDate));
        this.selectedFamilyMemberIndex = -1;
        this.familyMemberEditing = false;
        this.documentPrefix = extractDocumentPrefix(this.person.documentNumber) || prefixForDocumentType(this.person.documentType);
        this.person.documentNumber = stripDocumentPrefix(this.person.documentNumber);
        this.spouseDocumentPrefix = extractDocumentPrefix(this.person.familyData?.spouseDocumentNumber ?? '');
        if (this.person.familyData?.spouseDocumentNumber) {
            this.person.familyData.spouseDocumentNumber = stripDocumentPrefix(this.person.familyData.spouseDocumentNumber);
        }
        this.childDocumentPrefixes = (this.person.familyData?.children ?? []).map((child) => extractDocumentPrefix(child.documentNumber ?? ''));
        for (const child of this.person.familyData?.children ?? []) {
            child.documentNumber = stripDocumentPrefix(child.documentNumber ?? '');
        }
        this.vacationStartPicker = this.fromStoredDate(this.person.vacationData?.lastVacationStart);
        this.vacationEndPicker = this.fromStoredDate(this.person.vacationData?.lastVacationEnd);
        this.mpppstEntryDatePicker = this.fromStoredDate(this.person.laborData?.mpppstEntryDate);
        this.publicAdminEntryDatePicker = this.fromStoredDate(this.person.laborData?.publicAdministrationEntryDate);
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
        if (this.person.housingData) {
            this.person.housingData.municipality = '';
            this.person.housingData.parish = '';
        }
    }

    onCitySelectionChange(value: string): void {
        this.citySelection = value;
        this.person.city = value === 'Otro' ? '' : value;
    }

    private emptyFamilyData(): FamilyData {
        return { maritalStatus: '', numberOfChildren: 0, children: [] };
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

    private emptyLaborData(): LaborData {
        return {};
    }

    private emptyPerson(): Person {
        return {
            id: '',
            firstName: '',
            lastName: '',
            documentType: '',
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
            familyMembers: [],
            vacationData: this.emptyVacationData(),
            medicalData: this.emptyMedicalData(),
            housingData: this.emptyHousingData(),
            additionalData: this.emptyAdditionalData(),
            laborData: this.emptyLaborData(),
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
        this.childDocumentPrefixes.push('');
        if (this.person.familyData.children.length > (this.person.familyData.numberOfChildren || 0)) {
            this.person.familyData.numberOfChildren = this.person.familyData.children.length;
        }
    }

    removeChild(index: number): void {
        this.person.familyData?.children?.splice(index, 1);
        this.childBirthDatePickers.splice(index, 1);
        this.childDocumentPrefixes.splice(index, 1);
        this.clearChildValidationState();
        if (this.person.familyData && (this.person.familyData.children?.length ?? 0) < this.person.familyData.numberOfChildren) {
            this.person.familyData.numberOfChildren = this.person.familyData.children?.length ?? 0;
        }
    }

    addFamilyMember(): void {
        if (!this.person.familyMembers) {
            this.person.familyMembers = [];
        }
        this.person.familyMembers.push({ hasDocument: true, hasDisability: false, hasAllergies: false, adoptedOrFoster: false });
        this.familyMemberBirthDatePickers.push(null);
        this.selectedFamilyMemberIndex = this.person.familyMembers.length - 1;
        this.familyMemberEditing = true;
    }

    removeFamilyMember(index: number): void {
        this.person.familyMembers?.splice(index, 1);
        this.familyMemberBirthDatePickers.splice(index, 1);
        this.clearValidationState();
        if (this.selectedFamilyMemberIndex === index) {
            this.selectedFamilyMemberIndex = -1;
            this.familyMemberEditing = false;
        } else if (this.selectedFamilyMemberIndex > index) {
            this.selectedFamilyMemberIndex--;
        }
    }

    selectFamilyMember(index: number): void {
        this.selectedFamilyMemberIndex = index;
        this.familyMemberEditing = false;
    }

    startFamilyMemberEdit(): void {
        if (this.selectedFamilyMember) {
            this.familyMemberEditing = true;
        }
    }

    finishFamilyMemberEdit(): void {
        this.familyMemberEditing = false;
    }

    get selectedFamilyMember(): FamilyMember | null {
        return this.person.familyMembers?.[this.selectedFamilyMemberIndex] ?? null;
    }

    familyMemberFullName(member: FamilyMember): string {
        const name = [member.firstName, member.secondName, member.lastName, member.secondLastName].filter(Boolean).join(' ');
        return name || 'Familiar sin registrar';
    }

    familyMemberInitials(member: FamilyMember): string {
        return `${member.firstName?.charAt(0) ?? ''}${member.lastName?.charAt(0) ?? ''}`.toUpperCase();
    }

    familyMemberDocument(member: FamilyMember): string {
        return member.hasDocument && member.documentType && member.documentNumber ? composeDocumentNumber(member.documentType, member.documentNumber) : 'Sin documento';
    }

    familyMemberDocumentType(member: FamilyMember): string {
        if (!member.hasDocument) {
            return 'Sin documento';
        }
        return DOCUMENT_PREFIX_OPTIONS.find((option) => option.value === member.documentType)?.documentType ?? 'No registrado';
    }

    familyMemberDocumentNumber(member: FamilyMember): string {
        return member.hasDocument && member.documentNumber ? member.documentNumber : 'Sin documento';
    }

    onFamilyMemberDisabilityChange(index: number, value: boolean): void {
        const member = this.person.familyMembers?.[index];
        if (!member) {
            return;
        }
        member.hasDisability = value;
        if (!value) {
            member.disabilityType = '';
            member.disabilityGrade = '';
            member.conapdisCode = '';
        }
    }

    onFamilyMemberBirthDateChange(index: number, value: Date | null): void {
        const member = this.person.familyMembers?.[index];
        if (!member) {
            return;
        }
        member.birthDate = this.toStoredDate(value);
        this.touchedFields.add(`familyMemberBirthDate:${index}`);
        this.notifyValidationError(
            `familyMemberBirthDate:${index}`,
            member.birthDate ? validateChildBirthDate(member.birthDate) : null,
            'Fecha de nacimiento inválida'
        );
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
        return this.submitted || this.touchedFields.has('firstName') ? (validatePersonName(this.person.firstName, 'primer nombre') ?? '') : '';
    }

    secondNameError(): string {
        if ((!this.submitted && !this.touchedFields.has('secondName')) || !this.person.secondName?.trim()) {
            return '';
        }
        return validatePersonName(this.person.secondName, 'segundo nombre') ?? '';
    }

    lastNameError(): string {
        return this.submitted || this.touchedFields.has('lastName') ? (validatePersonName(this.person.lastName, 'primer apellido') ?? '') : '';
    }

    secondLastNameError(): string {
        if ((!this.submitted && !this.touchedFields.has('secondLastName')) || !this.person.secondLastName?.trim()) {
            return '';
        }
        return validatePersonName(this.person.secondLastName, 'segundo apellido') ?? '';
    }

    maritalStatusError(): string {
        if (!this.submitted && !this.touchedFields.has('maritalStatus')) {
            return '';
        }
        return this.person.familyData?.maritalStatus ? '' : 'Selecciona el estado civil.';
    }

    emailError(): string {
        if (!this.submitted && !this.touchedFields.has('email')) {
            return '';
        }
        return validateEmail(this.person.email ?? '') ?? '';
    }

    rifError(): string {
        if ((!this.submitted && !this.touchedFields.has('rif')) || !this.person.rif?.trim()) {
            return '';
        }
        return validateDocument('RIF', this.person.rif) ?? '';
    }

    personalPhoneError(): string {
        if (!this.submitted && !this.touchedFields.has('personalPhone')) {
            return '';
        }
        if (!this.personalPhoneCode && !this.personalPhoneNumber.trim()) {
            return 'El teléfono personal es obligatorio.';
        }
        if (!this.personalPhoneCode) {
            return 'Selecciona el código del teléfono personal.';
        }
        if (!/^\d{7}$/.test(this.personalPhoneNumber.replace(/\D/g, ''))) {
            return 'Escribe el número del teléfono personal de 7 dígitos.';
        }
        return '';
    }

    homePhoneError(): string {
        if (!this.submitted && !this.touchedFields.has('homePhone')) {
            return '';
        }
        const digits = this.homePhoneNumber.replace(/\D/g, '');
        if (!this.homePhoneCode && !digits) {
            return '';
        }
        if (!this.homePhoneCode) {
            return 'Selecciona el código de área del teléfono de habitación.';
        }
        if (!/^\d{7}$/.test(digits)) {
            return 'Escribe el número local de 7 dígitos (sin el código de área).';
        }
        return '';
    }

    documentError(): string {
        if (!this.submitted && !this.touchedFields.has('document')) {
            return '';
        }
        if (!this.documentPrefix) {
            return 'Selecciona el tipo de documento de identidad (V, E, J, G, P o C).';
        }
        return validateDocument(this.person.documentType, composeDocumentNumber(this.documentPrefix, this.person.documentNumber)) ?? '';
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

    optionalCedulaError(field: string, value: string | undefined): string {
        if ((!this.submitted && !this.touchedFields.has(field)) || !value?.trim()) {
            return '';
        }
        return this.validateOptionalCedula(field, value) ?? '';
    }

    optionalPhoneError(field: string, value: string | undefined): string {
        if ((!this.submitted && !this.touchedFields.has(field)) || !value?.trim()) {
            return '';
        }
        return validatePhone(value) ?? '';
    }

    onFirstNameChange(): void {
        this.validateNameOnChange('firstName', this.person.firstName, 'primer nombre');
    }

    onSecondNameChange(): void {
        this.touchedFields.add('secondName');
        this.notifyValidationError('secondName', this.person.secondName?.trim() ? validatePersonName(this.person.secondName, 'segundo nombre') : null, 'Segundo nombre inválido');
    }

    onLastNameChange(): void {
        this.validateNameOnChange('lastName', this.person.lastName, 'primer apellido');
    }

    onSecondLastNameChange(): void {
        this.touchedFields.add('secondLastName');
        this.notifyValidationError('secondLastName', this.person.secondLastName?.trim() ? validatePersonName(this.person.secondLastName, 'segundo apellido') : null, 'Segundo apellido inválido');
    }

    onEmailChange(): void {
        this.touchedFields.add('email');
        this.notifyValidationError('email', this.person.email ? validateEmail(this.person.email) : null, 'Correo electrónico inválido');
    }

    onRifChange(): void {
        this.touchedFields.add('rif');
        this.notifyValidationError('rif', this.person.rif?.trim() ? validateDocument('RIF', this.person.rif) : null, 'RIF inválido');
    }

    onMaritalStatusChange(): void {
        this.touchedFields.add('maritalStatus');
        this.notifyValidationError('maritalStatus', this.person.familyData?.maritalStatus ? null : 'Selecciona el estado civil.', 'Estado civil requerido');
    }

    onPersonalPhoneChange(): void {
        this.touchedFields.add('personalPhone');
    }

    onHomePhoneChange(): void {
        this.touchedFields.add('homePhone');
        const digits = this.homePhoneNumber.replace(/\D/g, '');
        this.notifyValidationError(
            'homePhone',
            !this.homePhoneCode && !digits ? null : this.homePhoneCode && /^\d{7}$/.test(digits) ? null : 'Escribe un teléfono de habitación válido.',
            'Teléfono de habitación inválido'
        );
    }

    onOccupationalDiseaseChange(value: boolean): void {
        if (!this.person.medicalData) {
            return;
        }
        this.person.medicalData.hasOccupationalDisease = value;
        if (!value) {
            this.person.medicalData.occupationalDiseaseDescription = '';
        }
    }

    onDisabilityChange(value: boolean): void {
        if (!this.person.medicalData) {
            return;
        }
        this.person.medicalData.hasDisability = value;
        if (!value) {
            this.person.medicalData.disabilityType = '';
            this.person.medicalData.disabilityGrade = '';
            this.person.medicalData.conapdisCode = '';
        }
    }

    onMilitaryRegistrationChange(value: string | undefined): void {
        if (!this.person.additionalData) {
            return;
        }
        this.person.additionalData.militaryRegistration = value;
        if (value !== 'Inscrito') {
            this.person.additionalData.militaryRegistrationNumber = '';
        }
    }

    onDocumentPrefixChange(): void {
        this.person.documentType = documentTypeForPrefix(this.documentPrefix);
        this.validateDocumentOnChange();
    }

    onDocumentNumberChange(): void {
        this.validateDocumentOnChange();
    }

    onOptionalCedulaChange(field: string, value: string | undefined): void {
        this.touchedFields.add(field);
        this.notifyValidationError(field, this.validateOptionalCedula(field, value), 'Cédula inválida');
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

    onMpppstEntryDateChange(value: Date | null): void {
        if (this.person.laborData) {
            this.person.laborData.mpppstEntryDate = this.toStoredDate(value);
        }
    }

    onPublicAdminEntryDateChange(value: Date | null): void {
        if (this.person.laborData) {
            this.person.laborData.publicAdministrationEntryDate = this.toStoredDate(value);
        }
    }

    onHousingMunicipalityChange(): void {
        if (this.person.housingData) {
            this.person.housingData.parish = '';
        }
    }

    hasAddressType(): boolean {
        const housing = this.person.housingData;
        return !!(housing && (housing.thoroughfareType || housing.buildingType || housing.unitType || housing.zoneType));
    }

    officePhoneError(): string {
        if (!this.submitted) {
            return '';
        }
        const digits = (this.person.laborData?.officePhone ?? '').replace(/\D/g, '');
        if (!this.person.laborData?.officePhoneCode) {
            return 'Selecciona el código de área.';
        }
        if (!/^\d{7}$/.test(digits)) {
            return 'Escribe el número local de 7 dígitos (sin el código de área).';
        }
        return '';
    }

    onCompletionYearChange(): void {
        this.touchedFields.add('completionYear');
        this.notifyValidationError('completionYear', validateAcademicCompletionYear(this.person.academicData?.completionYear ?? ''), 'Año de culminación inválido');
    }

    private validateNameOnChange(field: 'firstName' | 'secondName' | 'lastName' | 'secondLastName', value: string, label: string): void {
        this.touchedFields.add(field);
        const error = validatePersonName(value, label);
        this.notifyValidationError(field, error, `${label.charAt(0).toUpperCase()}${label.slice(1)} inválido`);
    }

    private validateDocumentOnChange(): void {
        this.touchedFields.add('document');
        const error = this.documentPrefix
            ? validateDocument(this.person.documentType, composeDocumentNumber(this.documentPrefix, this.person.documentNumber))
            : 'Selecciona el tipo de documento de identidad (V, E, J, G, P o C).';
        this.notifyValidationError('document', error, 'Documento inválido');
    }

    private validateOptionalCedula(field: string, value: string | undefined): string | null {
        if (!value?.trim()) {
            return null;
        }
        const prefix = this.optionalCedulaPrefix(field);
        if (!prefix) {
            return 'Selecciona el tipo de documento (V o E).';
        }
        return validateCedula(composeDocumentNumber(prefix, value));
    }

    private optionalCedulaPrefix(field: string): string {
        if (field === 'spouseDocument') {
            return this.spouseDocumentPrefix;
        }
        const match = /^childDocument:(\d+)$/.exec(field);
        return match ? (this.childDocumentPrefixes[Number(match[1])] ?? '') : '';
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

    private validateFamilyMembers(): string | null {
        for (const [index, member] of (this.person.familyMembers ?? []).entries()) {
            const position = `integrante ${index + 1} del grupo familiar`;

            if (!member.firstName?.trim()) {
                return `Escribe el primer nombre del ${position}.`;
            }
            const firstNameError = validatePersonName(member.firstName, 'primer nombre');
            if (firstNameError) {
                return `${firstNameError} (${position})`;
            }
            const secondNameError = member.secondName?.trim() ? validatePersonName(member.secondName, 'segundo nombre') : null;
            if (secondNameError) {
                return `${secondNameError} (${position})`;
            }
            if (!member.lastName?.trim()) {
                return `Escribe el primer apellido del ${position}.`;
            }
            const lastNameError = validatePersonName(member.lastName, 'primer apellido');
            if (lastNameError) {
                return `${lastNameError} (${position})`;
            }
            const secondLastNameError = member.secondLastName?.trim() ? validatePersonName(member.secondLastName, 'segundo apellido') : null;
            if (secondLastNameError) {
                return `${secondLastNameError} (${position})`;
            }
            if (!member.gender) {
                return `Selecciona el sexo del ${position}.`;
            }
            if (!member.birthDate) {
                return `Selecciona la fecha de nacimiento del ${position}.`;
            }
            const birthDateError = validateChildBirthDate(member.birthDate);
            if (birthDateError) {
                return birthDateError;
            }
            if (!member.maritalStatus) {
                return `Selecciona el estado civil del ${position}.`;
            }
            if (!member.relationship) {
                return `Selecciona el parentesco del ${position}.`;
            }

            const personalPhone = (member.personalPhone ?? '').replace(/\D/g, '');
            if (!member.personalPhoneCode || !/^\d{7}$/.test(personalPhone)) {
                return `Completa el teléfono personal del ${position} (código y 7 dígitos).`;
            }
            const homePhone = (member.homePhone ?? '').replace(/\D/g, '');
            if (member.homePhoneCode || homePhone) {
                if (!member.homePhoneCode) {
                    return `Selecciona el código de área del teléfono de habitación del ${position}.`;
                }
                if (!/^\d{7}$/.test(homePhone)) {
                    return `Escribe el número local de 7 dígitos del teléfono de habitación del ${position}.`;
                }
            }

            if (!member.email?.trim()) {
                return `Escribe el correo electrónico personal del ${position}.`;
            }
            const emailError = validateEmail(member.email);
            if (emailError) {
                return emailError;
            }
            if (!member.laterality) {
                return `Selecciona la lateralidad del ${position}.`;
            }

            if (member.hasDocument && member.documentNumber?.trim()) {
                if (!member.documentType) {
                    return `Selecciona el tipo de documento del ${position}.`;
                }
                const documentError = validateDocument(
                    documentTypeForPrefix(member.documentType),
                    composeDocumentNumber(member.documentType, member.documentNumber)
                );
                if (documentError) {
                    return documentError;
                }
            }
        }
        return null;
    }

    savePerson(): void {
        this.submitted = true;

        if (!this.documentPrefix) {
            this.messageService.add({
                severity: 'error',
                summary: 'Documento requerido',
                detail: 'Selecciona el tipo de documento de identidad (V, E, J, G, P o C).',
                life: 4000
            });
            return;
        }

        if (
            !this.person.firstName?.trim() ||
            !this.person.lastName?.trim() ||
            !this.person.documentNumber?.trim() ||
            !this.person.type?.trim() ||
            !this.person.familyData?.maritalStatus ||
            !this.person.email?.trim() ||
            !this.personalPhoneCode ||
            !this.personalPhoneNumber.trim()
        ) {
            this.activeEditTab = '0';
            this.messageService.add({
                severity: 'error',
                summary: 'Formulario incompleto',
                detail: 'Completa los campos obligatorios para guardar los cambios.',
                life: 3500
            });
            return;
        }

        const nameErr = validatePersonName(this.person.firstName, 'primer nombre');
        if (nameErr) {
            this.activeEditTab = '0';
            this.messageService.add({
                severity: 'error',
                summary: 'Nombre inválido',
                detail: nameErr,
                life: 3500
            });
            return;
        }

        const lastNameErr = validatePersonName(this.person.lastName, 'primer apellido');
        if (lastNameErr) {
            this.activeEditTab = '0';
            this.messageService.add({
                severity: 'error',
                summary: 'Apellido inválido',
                detail: lastNameErr,
                life: 3500
            });
            return;
        }

        const secondNameErr = this.person.secondName?.trim() ? validatePersonName(this.person.secondName, 'segundo nombre') : null;
        if (secondNameErr) {
            this.activeEditTab = '0';
            this.messageService.add({ severity: 'error', summary: 'Segundo nombre inválido', detail: secondNameErr, life: 3500 });
            return;
        }

        const secondLastNameErr = this.person.secondLastName?.trim() ? validatePersonName(this.person.secondLastName, 'segundo apellido') : null;
        if (secondLastNameErr) {
            this.activeEditTab = '0';
            this.messageService.add({ severity: 'error', summary: 'Segundo apellido inválido', detail: secondLastNameErr, life: 3500 });
            return;
        }

        const emailErr = validateEmail(this.person.email ?? '');
        if (emailErr) {
            this.activeEditTab = '0';
            this.messageService.add({ severity: 'error', summary: 'Correo electrónico inválido', detail: emailErr, life: 4000 });
            return;
        }

        const rifErr = this.person.rif?.trim() ? validateDocument('RIF', this.person.rif) : null;
        if (rifErr) {
            this.activeEditTab = '0';
            this.messageService.add({ severity: 'error', summary: 'RIF inválido', detail: rifErr, life: 4000 });
            return;
        }

        const personalPhoneDigits = this.personalPhoneNumber.replace(/\D/g, '');
        if (!/^\d{7}$/.test(personalPhoneDigits)) {
            this.activeEditTab = '0';
            this.messageService.add({ severity: 'error', summary: 'Teléfono personal inválido', detail: 'Escribe el número del teléfono personal de 7 dígitos.', life: 4000 });
            return;
        }

        const homePhoneDigits = this.homePhoneNumber.replace(/\D/g, '');
        if (this.homePhoneCode || homePhoneDigits) {
            if (!this.homePhoneCode) {
                this.activeEditTab = '0';
                this.messageService.add({ severity: 'error', summary: 'Teléfono de habitación inválido', detail: 'Selecciona el código de área del teléfono de habitación.', life: 4000 });
                return;
            }
            if (!/^\d{7}$/.test(homePhoneDigits)) {
                this.activeEditTab = '0';
                this.messageService.add({ severity: 'error', summary: 'Teléfono de habitación inválido', detail: 'Escribe el número local de 7 dígitos (sin el código de área).', life: 4000 });
                return;
            }
        }

        this.person.phone = composePhoneNumber(this.personalPhoneCode, personalPhoneDigits);
        this.person.homePhone = this.homePhoneCode ? composePhoneNumber(this.homePhoneCode, homePhoneDigits) : '';

        const documentNumber = composeDocumentNumber(this.documentPrefix, this.person.documentNumber);
        const docErr = validateDocument(this.person.documentType, documentNumber);
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
            if (!this.spouseDocumentPrefix) {
                this.activeEditTab = '8';
                this.messageService.add({ severity: 'error', summary: 'Documento del cónyuge requerido', detail: 'Selecciona el tipo de documento (V o E) del cónyuge.', life: 4000 });
                return;
            }
            const spouseCedulaError = validateCedula(composeDocumentNumber(this.spouseDocumentPrefix, spouseCedula));
            if (spouseCedulaError) {
                this.activeEditTab = '8';
                this.messageService.add({ severity: 'error', summary: 'Cédula del cónyuge inválida', detail: spouseCedulaError, life: 4000 });
                return;
            }
            this.person.familyData!.spouseDocumentNumber = composeDocumentNumber(this.spouseDocumentPrefix, spouseCedula);
        }

        const spousePhone = this.person.familyData?.spousePhone?.trim();
        if (spousePhone) {
            const spousePhoneError = validatePhone(spousePhone);
            if (spousePhoneError) {
                this.activeEditTab = '8';
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

        for (const [index, child] of (this.person.familyData?.children ?? []).entries()) {
            const childNameErr = validatePersonName(child.name, 'nombre del hijo/a');
            if (childNameErr) {
                this.activeEditTab = '8';
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
                this.activeEditTab = '8';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Fecha de nacimiento del hijo/a inválida',
                    detail: childBirthDateErr,
                    life: 4000
                });
                return;
            }

            if (child.documentNumber?.trim()) {
                const prefix = this.childDocumentPrefixes[index] ?? '';
                if (!prefix) {
                    this.activeEditTab = '8';
                    this.messageService.add({ severity: 'error', summary: 'Documento del hijo/a requerido', detail: 'Selecciona el tipo de documento (V o E) del hijo/a.', life: 4000 });
                    return;
                }
                child.documentNumber = composeDocumentNumber(prefix, child.documentNumber);
                const childCedulaErr = validateCedula(child.documentNumber);
                if (childCedulaErr) {
                    this.activeEditTab = '8';
                    this.messageService.add({ severity: 'error', summary: 'Cédula del hijo/a inválida', detail: childCedulaErr, life: 4000 });
                    return;
                }
            }
        }

        const familyGroupError = this.validateFamilyMembers();
        if (familyGroupError) {
            this.activeEditTab = '8';
            this.messageService.add({
                severity: 'error',
                summary: 'Grupo familiar incompleto',
                detail: familyGroupError,
                life: 4000
            });
            return;
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

        const emergencyPhone = this.person.medicalData?.emergencyContactPhone?.trim();
        if (emergencyPhone) {
            const emergencyPhoneError = validatePhone(emergencyPhone);
            if (emergencyPhoneError) {
                this.activeEditTab = '3';
                this.messageService.add({ severity: 'error', summary: 'Teléfono de emergencia inválido', detail: emergencyPhoneError, life: 4000 });
                return;
            }
        }

        const secondaryEmergencyPhone = this.person.medicalData?.secondaryEmergencyContactPhone?.trim();
        if (secondaryEmergencyPhone) {
            const secondaryEmergencyPhoneError = validatePhone(secondaryEmergencyPhone);
            if (secondaryEmergencyPhoneError) {
                this.activeEditTab = '3';
                this.messageService.add({ severity: 'error', summary: 'Teléfono del segundo contacto inválido', detail: secondaryEmergencyPhoneError, life: 4000 });
                return;
            }
        }

        const labor = this.person.laborData;
        if (!labor?.administrativeState) {
            this.activeEditTab = '7';
            this.messageService.add({ severity: 'error', summary: 'Estado de adscripción requerido', detail: 'Selecciona el estado de la ubicación administrativa de adscripción.', life: 4000 });
            return;
        }
        if (!labor.physicalLocation?.trim()) {
            this.activeEditTab = '7';
            this.messageService.add({ severity: 'error', summary: 'Ubicación física requerida', detail: 'Escribe la ubicación física del trabajador.', life: 4000 });
            return;
        }
        const officePhoneDigits = (labor.officePhone ?? '').replace(/\D/g, '');
        if (!labor.officePhoneCode) {
            this.activeEditTab = '7';
            this.messageService.add({ severity: 'error', summary: 'Teléfono de oficina requerido', detail: 'Selecciona el código de área del teléfono de oficina.', life: 4000 });
            return;
        }
        if (!/^\d{7}$/.test(officePhoneDigits)) {
            this.activeEditTab = '7';
            this.messageService.add({ severity: 'error', summary: 'Teléfono de oficina inválido', detail: 'Escribe el número local de 7 dígitos (sin el código de área).', life: 4000 });
            return;
        }
        labor.physicalLocation = labor.physicalLocation.trim();
        labor.officePhone = officePhoneDigits;

        const housing = this.person.housingData;
        if (!housing) {
            return;
        }
        if (!this.person.department) {
            this.activeEditTab = '4';
            this.messageService.add({ severity: 'error', summary: 'Estado de habitación requerido', detail: 'Selecciona el estado de la dirección de habitación.', life: 4000 });
            return;
        }
        if (!housing.municipality?.trim()) {
            this.activeEditTab = '4';
            this.messageService.add({ severity: 'error', summary: 'Municipio requerido', detail: 'Selecciona el municipio de la dirección de habitación.', life: 4000 });
            return;
        }
        if (!housing.parish?.trim()) {
            this.activeEditTab = '4';
            this.messageService.add({ severity: 'error', summary: 'Parroquia requerida', detail: 'Selecciona o escribe la parroquia de la dirección de habitación.', life: 4000 });
            return;
        }
        if (!this.hasAddressType()) {
            this.activeEditTab = '4';
            this.messageService.add({ severity: 'error', summary: 'Tipo de dirección requerido', detail: 'Selecciona al menos un tipo de dirección (vía, edificación, inmueble o zona).', life: 4000 });
            return;
        }
        if (!housing.referencePoint?.trim()) {
            this.activeEditTab = '4';
            this.messageService.add({ severity: 'error', summary: 'Punto de referencia requerido', detail: 'Escribe un punto de referencia de la vivienda.', life: 4000 });
            return;
        }
        housing.parish = housing.parish.trim();
        housing.referencePoint = housing.referencePoint.trim();

        if (this.personService.documentExists(documentNumber, this.person.id)) {
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
            secondName: this.person.secondName,
            lastName: this.person.lastName,
            secondLastName: this.person.secondLastName,
            documentType: this.person.documentType,
            documentNumber,
            birthPlace: this.person.birthPlace,
            birthDate: this.person.birthDate,
            gender: this.person.gender,
            phone: this.person.phone,
            homePhone: this.person.homePhone,
            email: this.person.email,
            rif: this.person.rif,
            address: this.person.address,
            city: this.person.city,
            department: this.person.department,
            type: this.person.type,
            status: this.person.status,
            notes: this.person.notes,
            familyData: this.person.familyData,
            familyMembers: this.person.familyMembers,
            vacationData: this.person.vacationData,
            medicalData: this.person.medicalData,
            housingData: this.person.housingData,
            additionalData: this.person.additionalData,
            laborData: this.person.laborData,
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
        this.personExportService.exportToCsv(this.persons());
    }

    exportExcel(): void {
        this.personExportService.exportToExcel(this.persons());
    }

    initials(firstName: string, lastName: string): string {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    displayName(person: Person): string {
        return [person.firstName, person.secondName, person.lastName, person.secondLastName].filter(Boolean).join(' ');
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
            case 'Egresado':
                return 'danger';
            default:
                return 'info';
        }
    }
}
