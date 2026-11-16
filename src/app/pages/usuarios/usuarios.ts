import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/services/auth.service';
import { AppUser, NewUserInput, SECURITY_QUESTIONS, SecurityQuestion, TagSeverity, UpdateUserInput } from '@/app/services/models';
import { composeDocumentNumber, extractDocumentPrefix, stripDocumentPrefix, validateIdentityDocument, validatePassword, validatePersonName } from '@/app/services/validators';
import { DocumentPrefixSelect } from '@/app/components/document-prefix-select/document-prefix-select';

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        DialogModule,
        DocumentPrefixSelect,
        InputTextModule,
        PasswordModule,
        SelectModule,
        TableModule,
        TagModule,
        ToastModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './usuarios.html'
})
export class Usuarios {
    readonly auth = inject(AuthService);

    private readonly messageService = inject(MessageService);

    private readonly confirmationService = inject(ConfirmationService);

    readonly users = this.auth.users;

    readonly activeUsers = this.auth.activeUsers;

    readonly adminUsers = this.auth.adminUsers;

    readonly securityQuestionOptions = SECURITY_QUESTIONS.map((q) => ({ label: q, value: q }));

    userDialog = false;

    editing = false;

    editingSelf = false;

    submitted = false;

    cedulaTouched = false;

    cedulaPrefix = '';

    editingId: string | null = null;

    userForm: NewUserInput = this.emptyUser();

    securityQuestionsForm: { question: string; answer: string }[] = [
        { question: '', answer: '' },
        { question: '', answer: '' },
        { question: '', answer: '' }
    ];

    securityAnswerVisible: boolean[] = [false, false, false];

    openNew(): void {
        this.editing = false;
        this.editingSelf = false;
        this.editingId = null;
        this.submitted = false;
        this.cedulaTouched = false;
        this.cedulaPrefix = '';
        this.userForm = this.emptyUser();
        this.securityQuestionsForm = [
            { question: '', answer: '' },
            { question: '', answer: '' },
            { question: '', answer: '' }
        ];
        this.securityAnswerVisible = [false, false, false];
        this.userDialog = true;
    }

    editUser(user: AppUser): void {
        this.editing = true;
        this.editingSelf = this.isCurrentUser(user);
        this.editingId = user.id;
        this.submitted = false;
        this.cedulaTouched = false;
        this.cedulaPrefix = extractDocumentPrefix(user.cedula);
        this.userForm = {
            fullName: user.fullName,
            cedula: stripDocumentPrefix(user.cedula),
            password: '',
            role: 'Administrador',
            active: user.active
        };
        const existing = this.editingSelf ? (user.securityQuestions ?? []) : [];
        this.securityQuestionsForm = [0, 1, 2].map((i) => ({
            question: existing[i]?.question ?? '',
            answer: (existing[i]?.answer ?? '').toUpperCase()
        }));
        this.securityAnswerVisible = [false, false, false];
        this.userDialog = true;
    }

    hideDialog(): void {
        this.userDialog = false;
        this.submitted = false;
        this.cedulaTouched = false;
    }

    fullNameError(): string {
        return this.submitted ? (validatePersonName(this.userForm.fullName, 'nombre completo', { allowMultipleWords: true }) ?? '') : '';
    }

    cedulaError(): string {
        return this.submitted || this.cedulaTouched ? (validateIdentityDocument(this.cedulaPrefix, this.userForm.cedula) ?? '') : '';
    }

    get displayCedula(): string {
        return composeDocumentNumber(this.cedulaPrefix, this.userForm.cedula);
    }

    get manageCredentials(): boolean {
        return !this.editing || this.editingSelf;
    }

    passwordError(): string {
        if (!this.submitted) return '';
        if (this.editing && !this.userForm.password) return '';
        return validatePassword(this.userForm.password) ?? '';
    }

    securityQuestionError(index: number): string {
        if (!this.submitted) return '';
        const q = this.securityQuestionsForm[index];
        if (q.question && !q.answer.trim()) return 'Escribe la respuesta para esta pregunta.';
        if (!q.question && q.answer.trim()) return 'Selecciona una pregunta de seguridad.';
        return '';
    }

    toggleSecurityAnswerVisibility(index: number): void {
        this.securityAnswerVisible[index] = !this.securityAnswerVisible[index];
    }

    onSecurityAnswerChange(index: number, value: string): void {
        this.securityQuestionsForm[index].answer = (value ?? '').toUpperCase();
    }

    availableQuestionsFor(index: number): { label: string; value: string }[] {
        const usedQuestions = this.securityQuestionsForm
            .filter((_, i) => i !== index)
            .map((q) => q.question)
            .filter(Boolean);
        return this.securityQuestionOptions.filter((opt) => !usedQuestions.includes(opt.value));
    }

    saveUser(): void {
        this.submitted = true;

        const nameErr = validatePersonName(this.userForm.fullName, 'nombre completo', { allowMultipleWords: true });
        const cedulaErr = validateIdentityDocument(this.cedulaPrefix, this.userForm.cedula);
        const passErr = this.manageCredentials && (!this.editing || this.userForm.password) ? validatePassword(this.userForm.password) : null;

        const sqErr = this.manageCredentials && this.securityQuestionsForm.some((q) =>
            (q.question && !q.answer.trim()) || (!q.question && q.answer.trim())
        );

        if (nameErr || cedulaErr || passErr || sqErr) {
            const firstError = nameErr || cedulaErr || passErr || (sqErr ? 'Completa o limpia las preguntas de seguridad incompletas.' : null);
            this.messageService.add({
                severity: 'error',
                summary: 'Formulario con errores',
                detail: firstError ?? 'Por favor corrige los campos señalados.',
                life: 3500
            });
            return;
        }

        const securityQuestions: SecurityQuestion[] = this.securityQuestionsForm
            .filter((q) => q.question && q.answer.trim())
            .map((q) => ({ question: q.question, answer: q.answer.trim() }));

        let result;

        if (this.editing && this.editingId) {
            const input: UpdateUserInput = {
                fullName: this.userForm.fullName,
                cedula: composeDocumentNumber(this.cedulaPrefix, this.userForm.cedula),
                role: 'Administrador',
                active: this.userForm.active,
                ...(this.editingSelf ? { password: this.userForm.password, securityQuestions } : {})
            };
            result = this.auth.updateUser(this.editingId, input);
        } else {
            this.userForm.role = 'Administrador';
            this.userForm.cedula = composeDocumentNumber(this.cedulaPrefix, this.userForm.cedula);
            result = this.auth.createUser(this.userForm);
        }

        if (!result.ok) {
            this.messageService.add({
                severity: 'error',
                summary: 'No se pudo guardar',
                detail: result.message,
                life: 4000
            });
            return;
        }

        this.userDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: this.editing ? 'Usuario actualizado' : 'Usuario creado',
            detail: result.message,
            life: 3500
        });
    }

    toggleUser(user: AppUser): void {
        this.confirmationService.confirm({
            message: `¿Deseas ${user.active ? 'desactivar' : 'activar'} a ${user.fullName}?`,
            header: user.active ? 'Desactivar usuario' : 'Activar usuario',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: user.active ? 'Desactivar' : 'Activar',
            rejectLabel: 'Cancelar',
            accept: () => {
                const result = this.auth.toggleUser(user.id);
                this.messageService.add({
                    severity: result.ok ? 'success' : 'error',
                    summary: result.ok ? 'Estado actualizado' : 'No se pudo actualizar',
                    detail: result.message,
                    life: 3500
                });
            }
        });
    }

    deleteUser(user: AppUser): void {
        this.confirmationService.confirm({
            message: `¿Deseas eliminar permanentemente la cuenta de ${user.fullName}?`,
            header: 'Eliminar usuario',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const result = this.auth.deleteUser(user.id);
                this.messageService.add({
                    severity: result.ok ? 'success' : 'error',
                    summary: result.ok ? 'Usuario eliminado' : 'No se pudo eliminar',
                    detail: result.message,
                    life: 3500
                });
            }
        });
    }

    isCurrentUser(user: AppUser): boolean {
        return this.auth.currentUser()?.id === user.id;
    }

    initials(fullName: string): string {
        return fullName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase();
    }

    getRoleSeverity(role: string): TagSeverity {
        switch (role) {
            case 'Administrador': return 'contrast';
            case 'Registrador': return 'info';
            default: return 'secondary';
        }
    }

    private emptyUser(): NewUserInput {
        return {
            fullName: '',
            cedula: '',
            password: '',
            role: 'Administrador',
            active: true
        };
    }
}
