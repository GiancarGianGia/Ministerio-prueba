import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/services/auth.service';
import {
    CITIES_BY_DEPARTMENT,
    DEPARTMENTS,
    DOCUMENT_TYPES,
    GENDERS,
    NewPersonInput,
    Person,
    PERSON_STATUSES,
    PERSON_TYPES
} from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';
import { validateBirthDate, validateDocument, validatePersonName, validatePhone } from '@/app/services/validators';

@Component({
    selector: 'app-registro-persona',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, DatePickerModule, InputTextModule, SelectModule, TextareaModule, ToastModule],
    providers: [MessageService],
    templateUrl: './registro-persona.html'
})
export class RegistroPersona {
    private readonly personService = inject(PersonService);

    private readonly auth = inject(AuthService);

    private readonly messageService = inject(MessageService);

    readonly recentPersons = computed(() => this.personService.persons().slice(0, 4));

    person: NewPersonInput = this.emptyPerson();

    birthDatePicker: Date | null = null;

    citySelection = '';

    submitted = false;

    savedPerson = signal<Person | null>(null);

    readonly today = this.startOfDay(new Date());

    readonly minBirthDate = this.startOfDay(new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate()));

    readonly documentTypeOptions = DOCUMENT_TYPES.map((value) => ({ label: value, value }));

    readonly genderOptions = GENDERS.map((value) => ({ label: value, value }));

    readonly departmentOptions = DEPARTMENTS.map((value) => ({ label: value, value }));

    get cityOptions(): { label: string; value: string }[] {
        return [
            ...(CITIES_BY_DEPARTMENT[this.person.department] ?? []).map((value) => ({ label: value, value })),
            { label: 'Otro', value: 'Otro' }
        ];
    }

    readonly typeOptions = PERSON_TYPES.map((value) => ({ label: value, value }));

    readonly statusOptions = PERSON_STATUSES.filter((value) => value !== 'Inactivo').map((value) => ({ label: value, value }));

    save(): void {
        this.submitted = true;

        if (!this.person.firstName.trim() || !this.person.lastName.trim() || !this.person.documentType.trim() || !this.person.documentNumber.trim() || !this.person.birthDate.trim() || !this.person.phone.trim() || !this.person.type.trim()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Formulario incompleto',
                detail: 'Completa todos los campos obligatorios marcados con asterisco.',
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

        const documentError = validateDocument(this.person.documentType, this.person.documentNumber);
        if (documentError) {
            this.messageService.add({
                severity: 'error',
                summary: 'Documento inválido',
                detail: documentError,
                life: 4000
            });
            return;
        }

        const birthDateError = validateBirthDate(this.person.birthDate);
        if (birthDateError) {
            this.messageService.add({
                severity: 'error',
                summary: 'Fecha de nacimiento inválida',
                detail: birthDateError,
                life: 4000
            });
            return;
        }

        const phoneError = validatePhone(this.person.phone);
        if (phoneError) {
            this.messageService.add({
                severity: 'error',
                summary: 'Teléfono inválido',
                detail: phoneError,
                life: 4000
            });
            return;
        }

        if (this.personService.documentExists(this.person.documentNumber)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Documento duplicado',
                detail: 'Ya existe un trabajador registrado con ese número de documento.',
                life: 4000
            });
            return;
        }

        const created = this.personService.add(this.person, this.auth.currentUser()?.fullName ?? 'Sistema');
        this.savedPerson.set(created);
        this.person = this.emptyPerson();
        this.birthDatePicker = null;
        this.submitted = false;
        this.clearValidationState();

        this.messageService.add({
            severity: 'success',
            summary: 'Trabajador registrado',
            detail: `${created.firstName} ${created.lastName} fue registrado con el código ${created.id}.`,
            life: 4000
        });
    }

    resetForm(): void {
        this.person = this.emptyPerson();
        this.birthDatePicker = null;
        this.citySelection = '';
        this.submitted = false;
        this.clearValidationState();
    }

    registerAnother(): void {
        this.savedPerson.set(null);
        this.resetForm();
    }

    onDepartmentChange(): void {
        this.person.city = '';
        this.citySelection = '';
    }

    onCitySelectionChange(value: string): void {
        this.citySelection = value;
        this.person.city = value === 'Otro' ? '' : value;
    }

    onDocumentTypeChange(): void {
        this.validateDocumentOnChange();
    }

    onDocumentNumberChange(): void {
        this.validateDocumentOnChange();
    }

    onPhoneChange(): void {
        this.touchedFields.add('phone');
        this.notifyValidationError('phone', validatePhone(this.person.phone), 'Teléfono inválido');
    }

    onBirthDatePickerChange(value: Date | null): void {
        this.person.birthDate = this.toStoredDate(value);
        this.touchedFields.add('birthDate');
        this.notifyValidationError('birthDate', validateBirthDate(this.person.birthDate), 'Fecha de nacimiento inválida');
    }

    initials(firstName: string, lastName: string): string {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    firstNameError(): string {
        return this.submitted ? (validatePersonName(this.person.firstName, 'nombres') ?? '') : '';
    }

    lastNameError(): string {
        return this.submitted ? (validatePersonName(this.person.lastName, 'apellidos') ?? '') : '';
    }

    documentError(): string {
        if (!this.submitted && !this.touchedFields.has('document')) {
            return '';
        }
        return validateDocument(this.person.documentType, this.person.documentNumber) ?? '';
    }

    birthDateError(): string {
        return this.submitted || this.touchedFields.has('birthDate') ? (validateBirthDate(this.person.birthDate) ?? '') : '';
    }

    phoneError(): string {
        if (!this.submitted && !this.touchedFields.has('phone')) {
            return '';
        }
        return validatePhone(this.person.phone) ?? '';
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

    private startOfDay(date: Date): Date {
        date.setHours(0, 0, 0, 0);
        return date;
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

    private readonly touchedFields = new Set<string>();

    private readonly notifiedValidationErrors = new Map<string, string>();

    private emptyPerson(): NewPersonInput {
        return {
            firstName: '',
            lastName: '',
            documentType: DOCUMENT_TYPES[0],
            documentNumber: '',
            birthDate: '',
            gender: GENDERS[0],
            phone: '',
            address: '',
            city: '',
            department: '',
            type: '',
            status: 'Activo',
            notes: ''
        };
    }
}
