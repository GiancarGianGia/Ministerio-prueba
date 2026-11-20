import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
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
    AcademicTitle,
    BLOOD_TYPES,
    CHRONIC_PATHOLOGIES,
    CITIES_BY_DEPARTMENT,
    DEPARTMENTS,
    DISABILITY_GRADES,
    DISABILITY_TYPES,
    DOCUMENT_PREFIX_OPTIONS,
    EMERGENCY_CONTACT_RELATIONSHIPS,
    FamilyData,
    FamilyMember,
    FAMILY_RELATIONSHIPS,
    GENDERS,
    HOME_PHONE_CODES,
    HousingData,
    HOUSING_CONDITIONS,
    HOUSING_TYPES,
    isChildMember,
    isSpouseMember,
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
    SelectOption,
    TagSeverity,
    VACATION_STATUSES,
    VacationData
} from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';
import { IdentityVerificationService } from '@/app/services/identity-verification.service';
import { TREATMENT_CATALOG } from '@/app/services/treatment-catalog';
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
        CheckboxModule,
        AutoCompleteModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    styles: [
        `
            :host ::ng-deep p-tab.tab-attention {
                box-shadow: inset 0 0 0 2px #dc2626;
                border-radius: 0.375rem;
                color: #b91c1c;
            }

            .member-notice,
            .member-verified,
            .member-medical {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.65rem 0.85rem;
                border-radius: 0.5rem;
                font-size: 0.85rem;
                line-height: 1.35;
            }

            .member-notice {
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                color: #1d4ed8;
            }

            .member-verified {
                background: #ecfdf5;
                border: 1px solid #a7f3d0;
                color: #047857;
            }

            .member-medical {
                background: #ecfdf5;
                border: 1px solid #a7f3d0;
                color: #047857;
            }

            .member-medical-blocked {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #b91c1c;
            }

            .member-verified-row {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex-wrap: wrap;
            }
        `
    ],
    templateUrl: './personas.html'
})
export class Personas {
    private readonly personService = inject(PersonService);

    private readonly auth = inject(AuthService);

    private readonly messageService = inject(MessageService);

    private readonly confirmationService = inject(ConfirmationService);

    private readonly personExportService = inject(PersonExportService);

    private readonly identityVerification = inject(IdentityVerificationService);

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

    readonly genderOptions = GENDERS.map((value) => ({ label: value, value }));

    readonly departmentOptions = DEPARTMENTS.map((value) => ({ label: value, value }));

    get cityOptions(): SelectOption[] {
        return [
            ...(CITIES_BY_DEPARTMENT[this.person.department] ?? []).map((value) => ({ label: value, value })),
            { label: 'Otro', value: 'Otro' }
        ];
    }

    get housingMunicipalityOptions(): SelectOption[] {
        const state = this.person.department;
        return state ? (MUNICIPALITIES_BY_STATE[state] ?? []).map((value) => ({ label: value, value })) : [];
    }

    get housingParishOptions(): SelectOption[] {
        const state = this.person.department;
        const municipality = this.person.housingData?.municipality;
        const key = state && municipality ? `${state}::${municipality}` : '';
        return key ? (PARISHES_BY_MUNICIPALITY[key] ?? []).map((value) => ({ label: value, value })) : [];
    }

    readonly maritalStatusOptions = MARITAL_STATUSES.map((value) => ({ label: value, value }));

    readonly relationshipOptions = FAMILY_RELATIONSHIPS.map((value) => ({ label: value, value }));

    readonly emergencyRelationshipOptions = EMERGENCY_CONTACT_RELATIONSHIPS.map((value) => ({ label: value, value }));

    readonly chronicPathologyOptions = CHRONIC_PATHOLOGIES.map((value) => ({ label: value, value }));

    readonly treatmentOptions = TREATMENT_CATALOG.map((value) => ({ label: value, value }));

    chronicTreatmentOptions: SelectOption[] = [...this.treatmentOptions];

    /** Sugerencias filtradas del autocompletado de tratamientos */
    filteredTreatments: string[] = [];

    /** Snapshot del estado original del trabajador al abrir el modal */
    private personSnapshot = '';

    readonly vacationStatusOptions = VACATION_STATUSES.map((value) => ({ label: value, value }));

    readonly bloodTypeOptions = BLOOD_TYPES.map((value) => ({ label: value, value }));

    readonly lateralityOptions = LATERALITY_OPTIONS.map((value) => ({ label: value, value }));

    disabilityTypeOptions: SelectOption[] = DISABILITY_TYPES.map((value) => ({ label: value, value }));

    disabilityGradeOptions: SelectOption[] = DISABILITY_GRADES.map((value) => ({ label: value, value }));

    readonly militaryRegistrationOptions = MILITARY_REGISTRATION_OPTIONS.map((value) => ({ label: value, value }));

    readonly childrenCountOptions = Array.from({ length: 11 }, (_, index) => ({ label: String(index), value: index }));

    readonly shirtSizeOptions = SHIRT_SIZES.map((value) => ({ label: value, value }));

    readonly pantsSizeOptions = PANTS_SIZES.map((value) => ({ label: value, value }));

    readonly shoeSizeOptions = SHOE_SIZES.map((value) => ({ label: value, value }));

    readonly jacketSizeOptions = JACKET_SIZES.map((value) => ({ label: value, value }));

    // Academic data options
    readonly academicLevelOptions = [
        { label: 'Primaria', value: 'Primaria' },
        { label: 'Secundaria', value: 'Secundaria' },
        { label: 'Técnico Superior', value: 'Técnico Superior' },
        { label: 'Universitario', value: 'Universitario' },
        { label: 'Postgrado', value: 'Postgrado' }
    ];
    readonly yesNoOptions: SelectOption<boolean>[] = [
        { label: 'Sí', value: true },
        { label: 'No', value: false }
    ];
    readonly continueStudyOptions = [
        { label: 'Sí', value: 'Sí' },
        { label: 'No', value: 'No' }
    ];
    readonly studyOptionList = [
        { label: 'Primaria', value: 'Primaria' },
        { label: 'Secundaria', value: 'Secundaria' },
        { label: 'Técnico Superior', value: 'Técnico Superior' },
        { label: 'Universitario', value: 'Universitario' },
        { label: 'Postgrado', value: 'Postgrado' }
    ];

    readonly housingTypeOptions = HOUSING_TYPES.map((value) => ({ label: value, value }));

    readonly housingConditionOptions = HOUSING_CONDITIONS.map((value) => ({ label: value, value }));

    readonly thoroughfareTypeOptions = ADDRESS_THOROUGHFARE_TYPES;

    readonly buildingTypeOptions = ADDRESS_BUILDING_TYPES;

    readonly unitTypeOptions = ADDRESS_UNIT_TYPES;

    readonly zoneTypeOptions = ADDRESS_ZONE_TYPES;

    readonly officePhoneCodeOptions = OFFICE_PHONE_CODES.map((value) => ({ label: value, value }));

    readonly personalPhoneCodeOptions = PERSONAL_PHONE_CODES.map((value) => ({ label: value, value }));

    readonly homePhoneCodeOptions = HOME_PHONE_CODES.map((value) => ({ label: value, value }));

    private static readonly TAB_ORDER = ['0', '7', '8', '2', '3', '4', '5', '6'] as const;

    private static readonly TAB_LABELS: Record<string, string> = {
        '0': 'Datos Básicos',
        '7': 'Datos laborales',
        '8': 'Grupo Familiar',
        '2': 'Vacaciones',
        '3': 'Datos médicos',
        '4': 'Datos habitacionales',
        '5': 'Datos adicionales',
        '6': 'Datos académicos'
    };

    activeEditTab = '0';

    readonly showValidationHighlights = signal(false);

    private tabSnapshots: Record<string, string> = {};

    personDialog = false;

    viewMode = false;

    person: Person = this.emptyPerson();

    documentPrefix = '';

    personalPhoneCode = '';

    personalPhoneNumber = '';

    homePhoneCode = '';

    homePhoneNumber = '';

    emergencyPhoneCode = '';

    emergencyPhoneNumber = '';

    secondaryEmergencyPhoneCode = '';

    secondaryEmergencyPhoneNumber = '';

    birthDatePicker: Date | null = null;

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
            familyData: person.familyData ? { ...person.familyData } : this.emptyFamilyData(),
            familyMembers: (person.familyMembers ?? []).map((member) => ({ ...member })),
            vacationData: person.vacationData ? { ...person.vacationData } : this.emptyVacationData(),
            medicalData: {
                ...this.emptyMedicalData(),
                ...person.medicalData,
                chronicPathologies: (person.medicalData?.chronicPathologies ?? []).map((row) => ({ ...row }))
            },
            housingData: person.housingData ? { ...person.housingData } : this.emptyHousingData(),
            additionalData: { ...this.emptyAdditionalData(), ...person.additionalData },
            laborData: person.laborData ? { ...person.laborData } : this.emptyLaborData(),
            academicData: {
                continueStudies: '',
                studyOptions: '',
                wantsToFacilitate: false,
                ...person.academicData,
                titles: (person.academicData?.titles ?? []).map((title) => ({ ...title, completionYear: String(title.completionYear ?? '') }))
            }
        };
        const catalog = new Set(TREATMENT_CATALOG);
        const legacyTreatments = new Set(
            (this.person.medicalData?.chronicPathologies ?? [])
                .map((row) => (row.treatment ?? '').trim())
                .filter((treatment) => treatment && !catalog.has(treatment))
        );
        this.chronicTreatmentOptions = [
            ...Array.from(legacyTreatments, (value) => ({ label: value, value })),
            ...this.treatmentOptions
        ];
        this.disabilityTypeOptions = this.withLegacyOption(DISABILITY_TYPES, this.person.medicalData?.disabilityType);
        this.disabilityGradeOptions = this.withLegacyOption(DISABILITY_GRADES, this.person.medicalData?.disabilityGrade);
        this.birthDatePicker = this.fromStoredDate(this.person.birthDate);
        const personalPhone = splitPhoneNumber(this.person.phone);
        this.personalPhoneCode = personalPhone.code;
        this.personalPhoneNumber = personalPhone.number;
        const homePhone = splitPhoneNumber(this.person.homePhone ?? '');
        this.homePhoneCode = homePhone.code;
        this.homePhoneNumber = homePhone.number;
        const emergencyPhone = splitPhoneNumber(this.person.medicalData?.emergencyContactPhone ?? '');
        this.emergencyPhoneCode = emergencyPhone.code;
        this.emergencyPhoneNumber = emergencyPhone.number;
        const secondaryEmergencyPhone = splitPhoneNumber(this.person.medicalData?.secondaryEmergencyContactPhone ?? '');
        this.secondaryEmergencyPhoneCode = secondaryEmergencyPhone.code;
        this.secondaryEmergencyPhoneNumber = secondaryEmergencyPhone.number;
        this.familyMemberBirthDatePickers = (this.person.familyMembers ?? []).map((member) => this.fromStoredDate(member.birthDate));
        this.selectedFamilyMemberIndex = -1;
        this.familyMemberEditing = false;
        this.documentPrefix = extractDocumentPrefix(this.person.documentNumber) || prefixForDocumentType(this.person.documentType);
        this.person.documentNumber = stripDocumentPrefix(this.person.documentNumber);
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
        this.showValidationHighlights.set(false);
        this.personDialog = true;
        this.personSnapshot = this.serializePersonState();
        this.captureTabSnapshots();
    }

    hideDialog(): void {
        if (!this.viewMode && this.hasUnsavedChanges()) {
            this.confirmationService.confirm({
                header: 'Cambios sin guardar',
                message: this.unsavedChangesMessage(),
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Salir sin guardar',
                rejectLabel: 'Seguir editando',
                acceptButtonStyleClass: 'p-button-danger',
                rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
                accept: () => {
                    this.forceCloseDialog();
                }
            });
            return;
        }
        this.forceCloseDialog();
    }

    /** Intercepta el cierre nativo del diálogo (X, Escape, clic fuera) */
    onDialogHide(): void {
        if (!this.viewMode && this.hasUnsavedChanges()) {
            // Reabre el diálogo inmediatamente y muestra la confirmación
            this.personDialog = true;
            this.confirmationService.confirm({
                header: 'Cambios sin guardar',
                message: this.unsavedChangesMessage(),
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Salir sin guardar',
                rejectLabel: 'Seguir editando',
                acceptButtonStyleClass: 'p-button-danger',
                rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
                accept: () => {
                    this.forceCloseDialog();
                }
            });
            return;
        }
        this.forceCloseDialog();
    }

    /** Cierra el diálogo sin verificar cambios */
    private forceCloseDialog(): void {
        this.personDialog = false;
        this.viewMode = false;
        this.submitted = false;
        this.personSnapshot = '';
        this.tabSnapshots = {};
        this.showValidationHighlights.set(false);
        this.clearValidationState();
    }

    /** Detecta si el formulario actual difiere del estado original */
    private hasUnsavedChanges(): boolean {
        return this.personSnapshot !== '' && this.serializePersonState() !== this.personSnapshot;
    }

    /** Serializa el estado editable del trabajador para comparación */
    private serializePersonState(): string {
        return JSON.stringify({
            person: this.person,
            documentPrefix: this.documentPrefix,
            personalPhoneCode: this.personalPhoneCode,
            personalPhoneNumber: this.personalPhoneNumber,
            homePhoneCode: this.homePhoneCode,
            homePhoneNumber: this.homePhoneNumber,
            emergencyPhoneCode: this.emergencyPhoneCode,
            emergencyPhoneNumber: this.emergencyPhoneNumber,
            secondaryEmergencyPhoneCode: this.secondaryEmergencyPhoneCode,
            secondaryEmergencyPhoneNumber: this.secondaryEmergencyPhoneNumber,
            citySelection: this.citySelection
        });
    }

    private captureTabSnapshots(): void {
        this.tabSnapshots = {};
        for (const tab of Personas.TAB_ORDER) {
            this.tabSnapshots[tab] = this.serializeTab(tab);
        }
    }

    private serializeTab(tab: string): string {
        const medical = this.person.medicalData;
        switch (tab) {
            case '0':
                return JSON.stringify({
                    documentPrefix: this.documentPrefix,
                    documentNumber: this.person.documentNumber,
                    firstName: this.person.firstName,
                    secondName: this.person.secondName ?? '',
                    lastName: this.person.lastName,
                    secondLastName: this.person.secondLastName ?? '',
                    birthPlace: this.person.birthPlace ?? '',
                    birthDate: this.person.birthDate,
                    gender: this.person.gender,
                    maritalStatus: this.person.familyData?.maritalStatus ?? '',
                    personalPhoneCode: this.personalPhoneCode,
                    personalPhoneNumber: this.personalPhoneNumber,
                    homePhoneCode: this.homePhoneCode,
                    homePhoneNumber: this.homePhoneNumber,
                    email: this.person.email ?? '',
                    rif: this.person.rif ?? ''
                });
            case '7':
                return JSON.stringify({
                    laborData: this.person.laborData,
                    type: this.person.type,
                    status: this.person.status
                });
            case '8':
                return JSON.stringify(this.person.familyMembers ?? []);
            case '2':
                return JSON.stringify(this.person.vacationData ?? null);
            case '3':
                return JSON.stringify({
                    chronicPathologies: medical?.chronicPathologies ?? [],
                    allergies: medical?.allergies ?? '',
                    observations: medical?.observations ?? '',
                    emergencyContactName: medical?.emergencyContactName ?? '',
                    emergencyContactRelationship: medical?.emergencyContactRelationship ?? '',
                    secondaryEmergencyContactName: medical?.secondaryEmergencyContactName ?? '',
                    secondaryEmergencyContactRelationship: medical?.secondaryEmergencyContactRelationship ?? '',
                    emergencyPhoneCode: this.emergencyPhoneCode,
                    emergencyPhoneNumber: this.emergencyPhoneNumber,
                    secondaryEmergencyPhoneCode: this.secondaryEmergencyPhoneCode,
                    secondaryEmergencyPhoneNumber: this.secondaryEmergencyPhoneNumber
                });
            case '4':
                return JSON.stringify({
                    department: this.person.department,
                    city: this.person.city,
                    citySelection: this.citySelection,
                    address: this.person.address,
                    housingData: this.person.housingData
                });
            case '5':
                return JSON.stringify({
                    additionalData: this.person.additionalData,
                    numberOfChildren: this.person.familyData?.numberOfChildren ?? 0,
                    spouseMpppstDepartment: this.person.familyData?.spouseMpppstDepartment ?? '',
                    hasOccupationalDisease: medical?.hasOccupationalDisease ?? false,
                    occupationalDiseaseDescription: medical?.occupationalDiseaseDescription ?? '',
                    hasDisability: medical?.hasDisability ?? false,
                    disabilityType: medical?.disabilityType ?? '',
                    disabilityGrade: medical?.disabilityGrade ?? '',
                    conapdisCode: medical?.conapdisCode ?? '',
                    laterality: medical?.laterality ?? '',
                    bloodType: medical?.bloodType ?? ''
                });
            case '6':
                return JSON.stringify(this.person.academicData ?? null);
            default:
                return '';
        }
    }

    private dirtyTabKeys(): string[] {
        return Personas.TAB_ORDER.filter((tab) => this.tabSnapshots[tab] !== undefined && this.tabSnapshots[tab] !== this.serializeTab(tab));
    }

    dirtyTabLabels(): string[] {
        return this.dirtyTabKeys().map((tab) => Personas.TAB_LABELS[tab] ?? `Pestaña ${tab}`);
    }

    private unsavedChangesMessage(): string {
        const labels = this.dirtyTabLabels();
        return labels.length
            ? `Tienes cambios sin guardar en: ${labels.join(', ')}. ¿Deseas salir sin guardar?`
            : 'Tienes cambios sin guardar. ¿Deseas salir sin guardar?';
    }

    tabHasIssues(tab: string): boolean {
        return this.showValidationHighlights() && this.tabHasMissingData(tab);
    }

    private tabHasMissingData(tab: string): boolean {
        switch (tab) {
            case '0':
                return (
                    !this.documentPrefix ||
                    !this.person.documentNumber?.trim() ||
                    !this.person.firstName?.trim() ||
                    !this.person.lastName?.trim() ||
                    !this.person.familyData?.maritalStatus ||
                    !this.personalPhoneCode ||
                    !/^\d{7}$/.test(this.personalPhoneNumber.replace(/\D/g, '')) ||
                    !this.person.email?.trim()
                );
            case '7':
                return (
                    !this.person.type?.trim() ||
                    !this.person.laborData?.administrativeState ||
                    !this.person.laborData?.physicalLocation?.trim() ||
                    !this.person.laborData?.officePhoneCode ||
                    !/^\d{7}$/.test((this.person.laborData?.officePhone ?? '').replace(/\D/g, ''))
                );
            case '8':
                return !!this.validateFamilyMembers();
            case '3':
                return !!this.validateEmergencyContact(1) || !!this.validateEmergencyContact(2);
            case '4':
                return (
                    !this.person.department ||
                    !this.person.housingData?.municipality?.trim() ||
                    !this.person.housingData?.parish?.trim() ||
                    !this.hasAddressType() ||
                    !this.person.housingData?.referencePoint?.trim()
                );
            case '6':
                return (
                    !this.person.academicData?.continueStudies ||
                    (this.person.academicData?.titles ?? []).some(
                        (title) =>
                            !!this.validateAcademicTitle(title) ||
                            !!validateAcademicInstitution(title.university ?? '') ||
                            !!validateAcademicCompletionYear(title.completionYear ?? '')
                    )
                );
            default:
                return false;
        }
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
        return { maritalStatus: '', numberOfChildren: 0 };
    }

    private emptyVacationData(): VacationData {
        return { status: VACATION_STATUSES[0] };
    }

    private emptyMedicalData(): MedicalData {
        return { hasDisability: false, hasOccupationalDisease: false, chronicPathologies: [] };
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
                titles: [],
                continueStudies: '',
                studyOptions: '',
                wantsToFacilitate: false
            }
        };
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
        this.closeFamilyMember();
    }

    closeFamilyMember(): void {
        this.familyMemberEditing = false;
        this.selectedFamilyMemberIndex = -1;
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
        if (!member.hasDocument) {
            const certificate = member.certificateNumber?.trim();
            return certificate ? `Certificado ${certificate}` : 'Sin documento';
        }
        return member.documentType && member.documentNumber ? composeDocumentNumber(member.documentType, member.documentNumber) : 'Sin documento';
    }

    familyMemberDocumentType(member: FamilyMember): string {
        if (!member.hasDocument) {
            return member.certificateNumber?.trim() ? 'Certificado de nacimiento' : 'Sin documento';
        }
        return DOCUMENT_PREFIX_OPTIONS.find((option) => option.value === member.documentType)?.documentType ?? 'No registrado';
    }

    familyMemberDocumentNumber(member: FamilyMember): string {
        if (!member.hasDocument) {
            return member.certificateNumber?.trim() || 'Sin documento';
        }
        return member.documentNumber || 'Sin documento';
    }

    familyMemberAge(member: FamilyMember): number | null {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(member.birthDate ?? '');
        if (!match) {
            return null;
        }
        const today = new Date();
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        let age = today.getFullYear() - year;
        if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
            age--;
        }
        return age >= 0 ? age : null;
    }

    familyMemberRequiresRepresentative(member: FamilyMember): boolean {
        const age = this.familyMemberAge(member);
        return age !== null && age < 9;
    }

    familyMemberUsesSaime(member: FamilyMember): boolean {
        const age = this.familyMemberAge(member);
        return age !== null && age >= 9;
    }

    onFamilyMemberHasDocumentChange(index: number, value: boolean): void {
        const member = this.person.familyMembers?.[index];
        if (!member) {
            return;
        }
        member.hasDocument = value;
        if (!value) {
            member.documentType = '';
            member.documentNumber = '';
            member.identitySource = undefined;
            member.medicalAttentionEnabled = false;
            this.clearFamilyMemberMedicalData(member);
        }
    }

    familyMemberMedicalAllowed(member: FamilyMember): boolean {
        return !this.familyMemberRequiresRepresentative(member) || member.medicalAttentionEnabled === true;
    }

    familyMemberRepresentativeDocument(member: FamilyMember): string {
        return member.representativeDocumentNumber?.trim()
            ? composeDocumentNumber(member.representativeDocumentType ?? 'V', member.representativeDocumentNumber)
            : 'Sin documento';
    }

    onFamilyMemberRepresentativeChange(member: FamilyMember): void {
        member.representativeName = '';
        member.representativeStatus = '';
        member.identitySource = undefined;
        member.medicalAttentionEnabled = false;
        this.clearFamilyMemberMedicalData(member);
    }

    verifyFamilyMemberRepresentative(index: number): void {
        const member = this.person.familyMembers?.[index];
        if (!member) {
            return;
        }
        if (!member.representativeDocumentType || !member.representativeDocumentNumber?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Representante requerido',
                detail: 'Selecciona el tipo y escribe el nro. de documento del representante.',
                life: 4000
            });
            return;
        }

        const document = composeDocumentNumber(member.representativeDocumentType, member.representativeDocumentNumber);
        const documentError = validateDocument(documentTypeForPrefix(member.representativeDocumentType), document);
        if (documentError) {
            this.messageService.add({ severity: 'error', summary: 'Documento inválido', detail: documentError, life: 4000 });
            return;
        }

        const result = this.identityVerification.verifyRepresentative(document);
        if (!result.found || !result.active || !result.record) {
            this.onFamilyMemberRepresentativeChange(member);
            this.messageService.add({ severity: 'error', summary: 'Representante no válido', detail: result.message, life: 5000 });
            return;
        }

        member.representativeName = result.record.fullName;
        member.representativeStatus = 'ACTIVO';
        member.identitySource = 'SIGEFIRRHH';
        member.medicalAttentionEnabled = true;
        member.representativeDocumentNumber = stripDocumentPrefix(member.representativeDocumentNumber);
        this.messageService.add({ severity: 'success', summary: 'Representante verificado', detail: result.message, life: 4000 });
    }

    onFamilyMemberDocumentChange(member: FamilyMember): void {
        if (member.identitySource === 'SAIME') {
            member.identitySource = undefined;
        }
    }

    lookupFamilyMemberInSaime(index: number): void {
        const member = this.person.familyMembers?.[index];
        if (!member) {
            return;
        }
        if (!member.hasDocument || !member.documentType || !member.documentNumber?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Documento requerido',
                detail: 'Selecciona el tipo y escribe el nro. de documento del beneficiario antes de consultar SAIME.',
                life: 4000
            });
            return;
        }

        const document = composeDocumentNumber(member.documentType, member.documentNumber);
        const documentError = validateDocument(documentTypeForPrefix(member.documentType), document);
        if (documentError) {
            this.messageService.add({ severity: 'error', summary: 'Documento inválido', detail: documentError, life: 4000 });
            return;
        }

        const result = this.identityVerification.lookupSaime(document);
        if (!result.found || !result.record) {
            this.messageService.add({ severity: 'warn', summary: 'Sin resultados en SAIME', detail: result.message, life: 5000 });
            return;
        }

        const record = result.record;
        member.firstName = member.firstName?.trim() || record.firstName;
        member.secondName = member.secondName?.trim() || record.secondName || '';
        member.lastName = member.lastName?.trim() || record.lastName;
        member.secondLastName = member.secondLastName?.trim() || record.secondLastName || '';
        member.gender = member.gender || record.gender || '';
        if (!member.birthDate && record.birthDate) {
            member.birthDate = record.birthDate;
            this.familyMemberBirthDatePickers[index] = this.fromStoredDate(record.birthDate);
        }
        member.identitySource = 'SAIME';
        this.messageService.add({ severity: 'success', summary: 'Consultado en SAIME', detail: result.message, life: 4000 });
    }

    private clearFamilyMemberMedicalData(member: FamilyMember): void {
        member.hasDisability = false;
        member.disabilityType = '';
        member.disabilityGrade = '';
        member.conapdisCode = '';
        member.hasAllergies = false;
        member.allergyTypes = '';
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
        if (member.identitySource === 'SIGEFIRRHH' && !this.familyMemberRequiresRepresentative(member)) {
            this.onFamilyMemberRepresentativeChange(member);
        } else if (member.identitySource === 'SAIME' && this.familyMemberRequiresRepresentative(member)) {
            member.identitySource = undefined;
        }
        this.touchedFields.add(`familyMemberBirthDate:${index}`);
        this.notifyValidationError(
            `familyMemberBirthDate:${index}`,
            member.birthDate ? validateChildBirthDate(member.birthDate) : null,
            'Fecha de nacimiento inválida'
        );
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

    addAcademicTitle(): void {
        this.person.academicData?.titles.push({ academicLevel: '', specialty: '', graduated: undefined, university: '', completionYear: '' });
    }

    removeAcademicTitle(index: number): void {
        this.person.academicData?.titles.splice(index, 1);
    }

    universityError(index: number): string {
        const title = this.person.academicData?.titles[index];
        if (!title) {
            return '';
        }
        return this.submitted || this.touchedFields.has(`university:${index}`) ? (validateAcademicInstitution(title.university ?? '') ?? '') : '';
    }

    completionYearError(index: number): string {
        const title = this.person.academicData?.titles[index];
        if (!title) {
            return '';
        }
        return this.submitted || this.touchedFields.has(`completionYear:${index}`) ? (validateAcademicCompletionYear(title.completionYear ?? '') ?? '') : '';
    }

    academicTitleError(index: number): string {
        return this.submitted ? (this.validateAcademicTitle(this.person.academicData?.titles[index]) ?? '') : '';
    }

    private validateAcademicTitle(title: AcademicTitle | undefined): string | null {
        if (!title) {
            return null;
        }
        const started = !!(
            title.academicLevel?.trim() ||
            title.specialty?.trim() ||
            title.university?.trim() ||
            title.completionYear?.trim() ||
            title.graduated !== undefined
        );
        if (!started) {
            return null;
        }
        if (!title.academicLevel) {
            return 'Selecciona el nivel académico del título.';
        }
        if (title.graduated === undefined) {
            return 'Selecciona si está graduado(a) en ese título.';
        }
        return null;
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

    private withLegacyOption(values: readonly string[], legacy?: string): SelectOption[] {
        const current = (legacy ?? '').trim();
        const options = values.map((value) => ({ label: value, value }));
        return current && !values.includes(current) ? [{ label: current, value: current }, ...options] : options;
    }

    addChronicPathology(): void {
        this.person.medicalData?.chronicPathologies.push({ pathology: '', treatment: '', observation: '' });
    }

    removeChronicPathology(index: number): void {
        this.person.medicalData?.chronicPathologies.splice(index, 1);
    }

    filterTreatments(event: { query: string }): void {
        const query = event.query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        this.filteredTreatments = TREATMENT_CATALOG.filter((item) =>
            item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query)
        );
    }

    emergencyContactError(index: 1 | 2): string {
        return this.submitted ? (this.validateEmergencyContact(index) ?? '') : '';
    }

    private validateEmergencyContact(index: 1 | 2): string | null {
        const medical = this.person.medicalData;
        if (!medical) {
            return null;
        }
        const isPrimary = index === 1;
        const name = (isPrimary ? medical.emergencyContactName : medical.secondaryEmergencyContactName)?.trim() ?? '';
        const relationship = (isPrimary ? medical.emergencyContactRelationship : medical.secondaryEmergencyContactRelationship)?.trim() ?? '';
        const code = isPrimary ? this.emergencyPhoneCode : this.secondaryEmergencyPhoneCode;
        const digits = (isPrimary ? this.emergencyPhoneNumber : this.secondaryEmergencyPhoneNumber).replace(/\D/g, '');
        const label = isPrimary ? 'contacto de emergencia' : 'segundo contacto de emergencia';

        if (!name && !relationship && !code && !digits) {
            return null;
        }
        if (!name) {
            return `Escribe el nombre del ${label}.`;
        }
        if (!relationship) {
            return `Selecciona el parentesco del ${label}.`;
        }
        if (!code || !/^\d{7}$/.test(digits)) {
            return `Selecciona el código y escribe los 7 dígitos del teléfono del ${label}.`;
        }
        return null;
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
        if (value !== 'Sí') {
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

    onBirthDateChange(): void {
        this.touchedFields.add('birthDate');
        this.notifyValidationError('birthDate', this.person.birthDate ? validateBirthDate(this.person.birthDate) : null, 'Fecha de nacimiento inválida');
    }

    onBirthDatePickerChange(value: Date | null): void {
        this.person.birthDate = this.toStoredDate(value);
        this.onBirthDateChange();
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

    onContinueStudiesChange(value: string | undefined): void {
        if (!this.person.academicData) {
            return;
        }
        this.person.academicData.continueStudies = value;
        if (value !== 'Sí') {
            this.person.academicData.studyOptions = '';
        }
    }

    onCompletionYearChange(index: number): void {
        const title = this.person.academicData?.titles[index];
        this.touchedFields.add(`completionYear:${index}`);
        this.notifyValidationError(
            `completionYear:${index}`,
            validateAcademicCompletionYear(title?.completionYear ?? ''),
            'Año de culminación inválido'
        );
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

            const age = this.familyMemberAge(member);
            if (age !== null && age < 9) {
                if (!member.hasDocument) {
                    if (!member.certificateNumber?.trim()) {
                        return `Registra el nro. de certificado de nacimiento del ${position} (menor de 9 años).`;
                    }
                } else {
                    if (!member.representativeDocumentType || !member.representativeDocumentNumber?.trim()) {
                        return `Registra el nro. de documento del representante del ${position} (menor de 9 años).`;
                    }
                    if (
                        member.identitySource !== 'SIGEFIRRHH' ||
                        member.representativeStatus !== 'ACTIVO' ||
                        !member.representativeName?.trim()
                    ) {
                        return `Verifica en Sigefirrhh el documento del representante del ${position}: debe ser un trabajador ACTIVO.`;
                    }
                }
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
        this.showValidationHighlights.set(true);

        if (!this.documentPrefix) {
            this.activeEditTab = '0';
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

        for (const member of this.person.familyMembers ?? []) {
            member.certificateNumber = member.certificateNumber?.trim() ?? '';
            if (member.hasDocument) {
                member.certificateNumber = '';
            } else {
                member.documentType = '';
                member.documentNumber = '';
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

        if (!this.person.academicData?.continueStudies) {
            this.activeEditTab = '6';
            this.messageService.add({
                severity: 'error',
                summary: 'Datos académicos incompletos',
                detail: 'Selecciona si desea continuar sus estudios.',
                life: 4000
            });
            return;
        }

        for (const title of this.person.academicData?.titles ?? []) {
            const titleError = this.validateAcademicTitle(title);
            if (titleError) {
                this.activeEditTab = '6';
                this.messageService.add({ severity: 'error', summary: 'Datos académicos incompletos', detail: titleError, life: 4000 });
                return;
            }
            const universityErr = validateAcademicInstitution(title.university ?? '');
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
            const completionYearErr = validateAcademicCompletionYear(title.completionYear ?? '');
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
        }

        for (const index of [1, 2] as const) {
            const emergencyError = this.validateEmergencyContact(index);
            if (emergencyError) {
                this.activeEditTab = '3';
                this.messageService.add({ severity: 'error', summary: 'Contacto de emergencia incompleto', detail: emergencyError, life: 4000 });
                return;
            }
        }
        if (this.person.medicalData) {
            this.person.medicalData.emergencyContactPhone = this.emergencyPhoneCode
                ? composePhoneNumber(this.emergencyPhoneCode, this.emergencyPhoneNumber.replace(/\D/g, ''))
                : '';
            this.person.medicalData.secondaryEmergencyContactPhone = this.secondaryEmergencyPhoneCode
                ? composePhoneNumber(this.secondaryEmergencyPhoneCode, this.secondaryEmergencyPhoneNumber.replace(/\D/g, ''))
                : '';
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

        if (this.person.familyData) {
            this.person.familyData.spouseWorksAtMpppst = !!this.person.familyData.spouseMpppstDepartment?.trim();
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
        this.personSnapshot = '';
        this.tabSnapshots = {};
        this.showValidationHighlights.set(false);
        this.messageService.add({
            severity: 'success',
            summary: 'Trabajador actualizado',
            detail: `${updated.firstName} ${updated.lastName} fue actualizado correctamente.`,
            life: 3000
        });
    }

    printWorkerCard(): void {
        const p = this.person;
        const fullName = [p.firstName, p.secondName, p.lastName, p.secondLastName].filter(Boolean).join(' ');
        const doc = composeDocumentNumber(this.documentPrefix, p.documentNumber);
        const phone = composePhoneNumber(this.personalPhoneCode, this.personalPhoneNumber.replace(/\D/g, ''));
        const homePhone = this.homePhoneCode ? composePhoneNumber(this.homePhoneCode, this.homePhoneNumber.replace(/\D/g, '')) : '—';

        const labor = p.laborData;
        const medical = p.medicalData;
        const housing = p.housingData;
        const family = p.familyData;
        const academic = p.academicData;
        const additional = p.additionalData;
        const vacation = p.vacationData;

        const esc = (value: unknown): string => this.escapeHtml(value);

        const addressParts = [
            housing?.thoroughfareType ? `${housing.thoroughfareType}: ${housing.thoroughfareDetails ?? ''}` : '',
            housing?.buildingType ? `${housing.buildingType}: ${housing.buildingDetails ?? ''}` : '',
            housing?.unitType ? `${housing.unitType}: ${housing.unitDetails ?? ''}` : '',
            housing?.zoneType ? `${housing.zoneType}: ${housing.zoneDetails ?? ''}` : ''
        ].filter(Boolean).join(' · ');

        const familyMembers = p.familyMembers ?? [];
        const spouse = familyMembers.find(isSpouseMember);
        const spouseName = spouse ? this.familyMemberFullName(spouse) : '';

        const pathologiesHtml = (medical?.chronicPathologies ?? [])
            .map((row) => `<li><strong>${esc(row.pathology)}</strong>${row.treatment ? ` — ${esc(row.treatment)}` : ''}${row.observation ? ` (${esc(row.observation)})` : ''}</li>`)
            .join('') || '<li>Ninguna registrada</li>';

        const childrenHtml = familyMembers
            .filter(isChildMember)
            .map((member) => {
                const documentNumber = member.documentNumber ? `${member.documentType ?? ''}${member.documentNumber}` : '';
                return `<li>${esc(this.familyMemberFullName(member))}${member.birthDate ? ` (${esc(member.birthDate)})` : ''}${documentNumber ? ` — ${esc(documentNumber)}` : ''}</li>`;
            })
            .join('') || '<li>Sin hijos registrados</li>';

        const titlesHtml = (academic?.titles ?? [])
            .map((t) => `<li>${esc(t.academicLevel ?? '')}${t.specialty ? ` en ${esc(t.specialty)}` : ''} — ${esc(t.university ?? '')}${t.completionYear ? ` (${esc(t.completionYear)})` : ''} ${t.graduated ? '✓ Graduado' : '○ No graduado'}</li>`)
            .join('') || '<li>Sin títulos registrados</li>';

        const familyMembersHtml = familyMembers
            .map((member) => {
                const memberName = esc(this.familyMemberFullName(member));
                return `<li>${memberName} — ${esc(member.relationship ?? 'Sin parentesco')}${member.documentNumber ? ` (${esc(member.documentType ?? '')}${esc(member.documentNumber)})` : ''}</li>`;
            })
            .join('') || '<li>Sin integrantes registrados</li>';

        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        const printContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Ficha del Trabajador — ${esc(fullName)}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.4; padding: 10mm; }
                .print-header { text-align: center; margin-bottom: 8mm; border-bottom: 2px solid #1d4ed8; padding-bottom: 5mm; }
                .print-header h1 { font-size: 13pt; font-weight: 800; color: #1d4ed8; letter-spacing: 0.5px; }
                .print-header p { font-size: 8pt; color: #475569; margin-top: 1mm; }
                .print-header .institution { font-size: 10pt; font-weight: 700; margin-bottom: 1mm; }
                .section { margin-bottom: 5mm; }
                .section-title { font-size: 10pt; font-weight: 800; color: #1d4ed8; border-bottom: 1px solid #dbeafe; padding-bottom: 1.5mm; margin-bottom: 3mm; }
                .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm 8mm; }
                .data-grid.three-cols { grid-template-columns: 1fr 1fr 1fr; }
                .data-item { display: flex; flex-direction: column; padding: 1mm 0; }
                .data-item .label { font-size: 7pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
                .data-item .value { font-size: 9.5pt; font-weight: 600; color: #0f172a; }
                .data-full { grid-column: 1 / -1; }
                ul { margin: 1mm 0 0 5mm; padding: 0; }
                ul li { font-size: 9pt; margin-bottom: 1mm; }
                .print-footer { margin-top: 12mm; text-align: center; font-size: 7.5pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 3mm; }
                .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 15mm; margin-top: 15mm; }
                .signature-line { border-top: 1px solid #334155; padding-top: 2mm; text-align: center; font-size: 8pt; color: #475569; }
                @media print { body { padding: 5mm; } }
            </style>
        </head>
        <body>
            <div class="print-header">
                <p class="institution">República Bolivariana de Venezuela</p>
                <h1>MINISTERIO DEL PODER POPULAR PARA EL PROCESO SOCIAL DE TRABAJO</h1>
                <p>Ficha del Trabajador — Generada el ${dateStr}</p>
            </div>

            <div class="section">
                <div class="section-title">1. Datos Básicos</div>
                <div class="data-grid">
                    <div class="data-item"><span class="label">Nombre completo</span><span class="value">${esc(fullName)}</span></div>
                    <div class="data-item"><span class="label">Documento de identidad</span><span class="value">${esc(doc)}</span></div>
                    <div class="data-item"><span class="label">Fecha de nacimiento</span><span class="value">${esc(p.birthDate) || '—'}</span></div>
                    <div class="data-item"><span class="label">Lugar de nacimiento</span><span class="value">${esc(p.birthPlace) || '—'}</span></div>
                    <div class="data-item"><span class="label">Sexo</span><span class="value">${esc(p.gender) || '—'}</span></div>
                    <div class="data-item"><span class="label">Estado civil</span><span class="value">${esc(family?.maritalStatus) || '—'}</span></div>
                    <div class="data-item"><span class="label">Teléfono personal</span><span class="value">${esc(phone)}</span></div>
                    <div class="data-item"><span class="label">Teléfono de habitación</span><span class="value">${esc(homePhone)}</span></div>
                    <div class="data-item"><span class="label">Correo electrónico</span><span class="value">${esc(p.email) || '—'}</span></div>
                    <div class="data-item"><span class="label">RIF</span><span class="value">${esc(p.rif) || '—'}</span></div>
                    <div class="data-item"><span class="label">Estado</span><span class="value">${esc(p.department) || '—'}</span></div>
                    <div class="data-item"><span class="label">Ciudad</span><span class="value">${esc(p.city) || '—'}</span></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">2. Datos Laborales</div>
                <div class="data-grid">
                    <div class="data-item"><span class="label">Cargo</span><span class="value">${esc(p.type) || '—'}</span></div>
                    <div class="data-item"><span class="label">Estatus</span><span class="value">${esc(p.status)}</span></div>
                    <div class="data-item"><span class="label">Ubicación administrativa</span><span class="value">${esc(labor?.administrativeLocation) || '—'} (${esc(labor?.administrativeState) || '—'})</span></div>
                    <div class="data-item"><span class="label">Ubicación física</span><span class="value">${esc(labor?.physicalLocation) || '—'}</span></div>
                    <div class="data-item"><span class="label">Cargo titular</span><span class="value">${esc(labor?.titularPosition) || '—'}</span></div>
                    <div class="data-item"><span class="label">Tipo de trabajador</span><span class="value">${esc(labor?.workerType) || '—'}</span></div>
                    <div class="data-item"><span class="label">Código de nómina</span><span class="value">${esc(labor?.payrollCode) || '—'}</span></div>
                    <div class="data-item"><span class="label">Teléfono de oficina</span><span class="value">${esc(labor?.officePhoneCode ?? '')}${esc(labor?.officePhone ?? '')}</span></div>
                    <div class="data-item"><span class="label">Ingreso al MPPPST</span><span class="value">${esc(labor?.mpppstEntryDate) || '—'}</span></div>
                    <div class="data-item"><span class="label">Ingreso Adm. Pública</span><span class="value">${esc(labor?.publicAdministrationEntryDate) || '—'}</span></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">3. Datos Médicos</div>
                <div class="data-grid">
                    <div class="data-item"><span class="label">Tipo de sangre</span><span class="value">${esc(medical?.bloodType) || '—'}</span></div>
                    <div class="data-item"><span class="label">Lateralidad</span><span class="value">${esc(medical?.laterality) || '—'}</span></div>
                    <div class="data-item"><span class="label">Discapacidad</span><span class="value">${medical?.hasDisability ? `Sí — ${esc(medical?.disabilityType ?? '')} (${esc(medical?.disabilityGrade ?? '')})` : 'No'}</span></div>
                    <div class="data-item"><span class="label">Enfermedad ocupacional</span><span class="value">${medical?.hasOccupationalDisease ? `Sí — ${esc(medical?.occupationalDiseaseDescription ?? '')}` : 'No'}</span></div>
                    <div class="data-item data-full"><span class="label">Alergias</span><span class="value">${esc(medical?.allergies) || 'Ninguna registrada'}</span></div>
                    <div class="data-item data-full"><span class="label">Patologías crónicas</span><ul>${pathologiesHtml}</ul></div>
                    <div class="data-item"><span class="label">Contacto de emergencia</span><span class="value">${esc(medical?.emergencyContactName) || '—'} (${esc(medical?.emergencyContactRelationship) || '—'}) — ${esc(medical?.emergencyContactPhone) || '—'}</span></div>
                    <div class="data-item"><span class="label">2do contacto de emergencia</span><span class="value">${esc(medical?.secondaryEmergencyContactName) || '—'} (${esc(medical?.secondaryEmergencyContactRelationship) || '—'}) — ${esc(medical?.secondaryEmergencyContactPhone) || '—'}</span></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">4. Datos Habitacionales</div>
                <div class="data-grid">
                    <div class="data-item"><span class="label">Municipio</span><span class="value">${esc(housing?.municipality) || '—'}</span></div>
                    <div class="data-item"><span class="label">Parroquia</span><span class="value">${esc(housing?.parish) || '—'}</span></div>
                    <div class="data-item data-full"><span class="label">Dirección</span><span class="value">${esc(addressParts) || '—'}</span></div>
                    <div class="data-item"><span class="label">Punto de referencia</span><span class="value">${esc(housing?.referencePoint) || '—'}</span></div>
                    <div class="data-item"><span class="label">Tipo de vivienda</span><span class="value">${esc(housing?.housingType) || '—'}</span></div>
                    <div class="data-item"><span class="label">Condición</span><span class="value">${esc(housing?.housingCondition) || '—'}</span></div>
                    <div class="data-item"><span class="label">Años en la dirección</span><span class="value">${esc(housing?.yearsAtAddress ?? '—')}</span></div>
                    <div class="data-item"><span class="label">Habitaciones</span><span class="value">${esc(housing?.numberOfRooms ?? '—')}</span></div>
                    <div class="data-item"><span class="label">Personas en la vivienda</span><span class="value">${esc(housing?.numberOfPeopleInHouse ?? '—')}</span></div>
                    <div class="data-item"><span class="label">Servicios básicos</span><span class="value">${housing?.hasBasicServices ? 'Sí' : 'No'}</span></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">5. Grupo Familiar</div>
                <div class="data-grid">
                    <div class="data-item"><span class="label">Estado civil</span><span class="value">${esc(family?.maritalStatus) || '—'}</span></div>
                    <div class="data-item"><span class="label">Número de hijos</span><span class="value">${esc(family?.numberOfChildren ?? 0)}</span></div>
                    <div class="data-item"><span class="label">Cónyuge</span><span class="value">${esc(spouseName) || '—'}</span></div>
                    <div class="data-item data-full"><span class="label">Hijos</span><ul>${childrenHtml}</ul></div>
                    <div class="data-item data-full"><span class="label">Integrantes del grupo familiar</span><ul>${familyMembersHtml}</ul></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">6. Datos Académicos</div>
                <div class="data-grid">
                    <div class="data-item data-full"><span class="label">Títulos obtenidos</span><ul>${titlesHtml}</ul></div>
                    <div class="data-item"><span class="label">¿Desea continuar estudios?</span><span class="value">${esc(academic?.continueStudies) || '—'}${academic?.continueStudies === 'Sí' && academic?.studyOptions ? ` (${esc(academic.studyOptions)})` : ''}</span></div>
                    <div class="data-item"><span class="label">¿Desea facilitar conocimientos?</span><span class="value">${academic?.wantsToFacilitate ? 'Sí' : 'No'}</span></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">7. Vacaciones</div>
                <div class="data-grid three-cols">
                    <div class="data-item"><span class="label">Estatus</span><span class="value">${esc(vacation?.status) || '—'}</span></div>
                    <div class="data-item"><span class="label">Última salida</span><span class="value">${esc(vacation?.lastVacationStart) || '—'}</span></div>
                    <div class="data-item"><span class="label">Último regreso</span><span class="value">${esc(vacation?.lastVacationEnd) || '—'}</span></div>
                    <div class="data-item"><span class="label">Días pendientes</span><span class="value">${esc(vacation?.pendingDays ?? '—')}</span></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">8. Datos Adicionales</div>
                <div class="data-grid three-cols">
                    <div class="data-item"><span class="label">Inscripción militar</span><span class="value">${esc(additional?.militaryRegistration) || '—'}${additional?.militaryRegistration === 'Sí' && additional?.militaryRegistrationNumber ? ` (${esc(additional.militaryRegistrationNumber)})` : ''}</span></div>
                    <div class="data-item"><span class="label">Talla de camisa</span><span class="value">${esc(additional?.shirtSize) || '—'}</span></div>
                    <div class="data-item"><span class="label">Talla de pantalón</span><span class="value">${esc(additional?.pantsSize) || '—'}</span></div>
                    <div class="data-item"><span class="label">Talla de calzado</span><span class="value">${esc(additional?.shoeSize) || '—'}</span></div>
                    <div class="data-item"><span class="label">Talla de chaqueta</span><span class="value">${esc(additional?.jacketSize) || '—'}</span></div>
                </div>
            </div>

            <div class="signature-area">
                <div class="signature-line">Firma del trabajador</div>
                <div class="signature-line">Firma del responsable</div>
            </div>

            <div class="print-footer">
                MPPPST — Sistema de Gestión de Talento Humano · Documento generado automáticamente el ${dateStr}
            </div>

            <script>window.onload = function() { window.print(); };<\/script>
        </body>
        </html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
        }
    }

    private escapeHtml(value: unknown): string {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
