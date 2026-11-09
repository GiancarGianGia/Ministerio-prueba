import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/services/auth.service';
import {
    DEPARTMENTS,
    DOCUMENT_TYPES,
    GENDERS,
    NewPersonInput,
    Person,
    PERSON_STATUSES,
    PERSON_TYPES
} from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';
import { isValidEmail, isValidVenezuelanPhone, validateBirthDate, validateDocument, validateEmail, validatePersonName, validatePhone } from '@/app/services/validators';

@Component({
    selector: 'app-registro-persona',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, SelectModule, TextareaModule, ToastModule],
    providers: [MessageService],
    templateUrl: './registro-persona.html'
})
export class RegistroPersona {
    private readonly personService = inject(PersonService);

    private readonly auth = inject(AuthService);

    private readonly messageService = inject(MessageService);

    readonly recentPersons = computed(() => this.personService.persons().slice(0, 4));

    person: NewPersonInput = this.emptyPerson();

    submitted = false;

    savedPerson = signal<Person | null>(null);

    readonly today = this.toDateInputValue(new Date());

    readonly minBirthDate = this.toDateInputValue(new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate()));

    readonly documentTypeOptions = DOCUMENT_TYPES.map((value) => ({ label: value, value }));

    readonly genderOptions = GENDERS.map((value) => ({ label: value, value }));

    readonly departmentOptions = DEPARTMENTS.map((value) => ({ label: value, value }));

    readonly typeOptions = PERSON_TYPES.map((value) => ({ label: value, value }));

    readonly statusOptions = PERSON_STATUSES.map((value) => ({ label: value, value }));

    save(): void {
        this.submitted = true;

        if (!this.person.firstName.trim() || !this.person.lastName.trim() || !this.person.documentType.trim() || !this.person.documentNumber.trim() || !this.person.birthDate.trim() || !this.person.email.trim() || !this.person.phone.trim() || !this.person.type.trim()) {
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

        const emailError = validateEmail(this.person.email);
        if (emailError) {
            this.messageService.add({
                severity: 'error',
                summary: 'Correo inválido',
                detail: emailError,
                life: 3500
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
        this.submitted = false;

        this.messageService.add({
            severity: 'success',
            summary: 'Trabajador registrado',
            detail: `${created.firstName} ${created.lastName} fue registrado con el código ${created.id}.`,
            life: 4000
        });
    }

    resetForm(): void {
        this.person = this.emptyPerson();
        this.submitted = false;
    }

    registerAnother(): void {
        this.savedPerson.set(null);
        this.resetForm();
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
        if (!this.submitted) {
            return '';
        }
        return validateDocument(this.person.documentType, this.person.documentNumber) ?? '';
    }

    birthDateError(): string {
        return this.submitted ? (validateBirthDate(this.person.birthDate) ?? '') : '';
    }

    emailError(): string {
        if (!this.submitted) {
            return '';
        }
        return validateEmail(this.person.email) ?? '';
    }

    phoneError(): string {
        if (!this.submitted) {
            return '';
        }
        return validatePhone(this.person.phone) ?? '';
    }

    private toDateInputValue(date: Date): string {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private emptyPerson(): NewPersonInput {
        return {
            firstName: '',
            lastName: '',
            documentType: DOCUMENT_TYPES[0],
            documentNumber: '',
            birthDate: '',
            gender: GENDERS[0],
            email: '',
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
