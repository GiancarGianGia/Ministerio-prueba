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
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/services/auth.service';
import { AppUser, NewUserInput, SECURITY_QUESTIONS, SecurityQuestion, TagSeverity, UpdateUserInput } from '@/app/services/models';
import { PASSWORD_CONFIRMATION_LABEL, PASSWORD_REQUIREMENTS, composeDocumentNumber, extractDocumentPrefix, missingPasswordRequirements, stripDocumentPrefix, validateIdentityDocument, validatePassword, validatePasswordConfirmation, validatePersonName } from '@/app/services/validators';
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
        TextareaModule,
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

    editingOriginalActive = false;

    editDeactivationReason = '';

    deactivateDialog = false;

    deactivateTarget: AppUser | null = null;

    deactivateReason = '';

    deactivateSubmitted = false;

    deleteDialog = false;

    deleteTarget: AppUser | null = null;

    deleteReason = '';

    deleteSubmitted = false;

    submitted = false;

    cedulaTouched = false;

    cedulaPrefix = '';

    editingId: string | null = null;

    userForm: NewUserInput = this.emptyUser();

    confirmPassword = '';

    readonly passwordRequirements = PASSWORD_REQUIREMENTS;

    readonly passwordConfirmationLabel = PASSWORD_CONFIRMATION_LABEL;

    securityQuestionsForm: { question: string; answer: string }[] = [
        { question: '', answer: '' },
        { question: '', answer: '' },
        { question: '', answer: '' }
    ];

    securityAnswerVisible: boolean[] = [false, false, false];

    openNew(): void {
        this.editing = false;
        this.editingSelf = false;
        this.editingOriginalActive = false;
        this.editDeactivationReason = '';
        this.editingId = null;
        this.submitted = false;
        this.cedulaTouched = false;
        this.cedulaPrefix = '';
        this.userForm = this.emptyUser();
        this.confirmPassword = '';
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
        this.editingOriginalActive = user.active;
        this.editDeactivationReason = '';
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
        this.confirmPassword = '';
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
        this.confirmPassword = '';
        this.editDeactivationReason = '';
        this.editingOriginalActive = false;
    }

    get editDeactivationRequired(): boolean {
        return this.editing && this.editingOriginalActive && !this.userForm.active;
    }

    editDeactivationReasonError(): string {
        return this.submitted && this.editDeactivationRequired && !this.editDeactivationReason.trim() ? 'Escribe el motivo de la deshabilitación.' : '';
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

    confirmPasswordError(): string {
        if (!this.submitted) return '';
        if (this.editing && !this.userForm.password && !this.confirmPassword) return '';
        return validatePasswordConfirmation(this.userForm.password, this.confirmPassword) ?? '';
    }

    passwordsMatch(): boolean {
        return !!this.userForm.password && this.userForm.password === this.confirmPassword;
    }

    missingPasswordRules(): string[] {
        const missing = missingPasswordRequirements(this.userForm.password);
        if (!this.passwordsMatch()) {
            missing.push(this.passwordConfirmationLabel);
        }
        return missing;
    }

    passwordHasIssues(): boolean {
        return (this.userForm.password.length > 0 || this.confirmPassword.length > 0) && this.missingPasswordRules().length > 0;
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
        const confirmPassErr = this.manageCredentials && (!this.editing || this.userForm.password || this.confirmPassword)
            ? validatePasswordConfirmation(this.userForm.password, this.confirmPassword)
            : null;

        const sqErr = this.manageCredentials && this.securityQuestionsForm.some((q) =>
            (q.question && !q.answer.trim()) || (!q.question && q.answer.trim())
        );

        const deactivationErr = this.editDeactivationRequired && !this.editDeactivationReason.trim()
            ? 'Escribe el motivo de la deshabilitación.'
            : null;

        if (nameErr || cedulaErr || passErr || confirmPassErr || sqErr || deactivationErr) {
            const firstError = nameErr || cedulaErr || passErr || confirmPassErr || (sqErr ? 'Completa o limpia las preguntas de seguridad incompletas.' : null) || deactivationErr;
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
                ...(this.editDeactivationRequired ? { deactivationReason: this.editDeactivationReason.trim() } : {}),
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
        if (!user.active) {
            this.activateUser(user);
            return;
        }

        this.deactivateTarget = user;
        this.deactivateReason = '';
        this.deactivateSubmitted = false;
        this.deactivateDialog = true;
    }

    deactivateReasonError(): string {
        return this.deactivateSubmitted && !this.deactivateReason.trim() ? 'Escribe el motivo de la deshabilitación.' : '';
    }

    confirmDeactivate(): void {
        this.deactivateSubmitted = true;

        const target = this.deactivateTarget;
        if (!target || !this.deactivateReason.trim()) {
            return;
        }

        const result = this.auth.toggleUser(target.id, this.deactivateReason);

        if (!result.ok) {
            this.messageService.add({
                severity: 'error',
                summary: 'No se pudo deshabilitar',
                detail: result.message,
                life: 4000
            });
            return;
        }

        this.deactivateDialog = false;
        this.deactivateTarget = null;
        this.messageService.add({
            severity: 'success',
            summary: 'Usuario deshabilitado',
            detail: `${target.fullName} fue deshabilitado. El motivo quedó registrado.`,
            life: 4000
        });
    }

    private activateUser(user: AppUser): void {
        this.confirmationService.confirm({
            message: `¿Deseas habilitar a ${user.fullName}?`,
            header: 'Habilitar usuario',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Habilitar',
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
        this.deleteTarget = user;
        this.deleteReason = '';
        this.deleteSubmitted = false;
        this.deleteDialog = true;
    }

    deleteReasonError(): string {
        return this.deleteSubmitted && !this.deleteReason.trim() ? 'Escribe el motivo de la eliminación.' : '';
    }

    confirmDelete(): void {
        this.deleteSubmitted = true;

        const target = this.deleteTarget;
        if (!target || !this.deleteReason.trim()) {
            return;
        }

        const result = this.auth.deleteUser(target.id, this.deleteReason);

        if (!result.ok) {
            this.messageService.add({
                severity: 'error',
                summary: 'No se pudo eliminar',
                detail: result.message,
                life: 4000
            });
            return;
        }

        this.deleteDialog = false;
        this.deleteTarget = null;
        this.messageService.add({
            severity: 'success',
            summary: 'Usuario eliminado',
            detail: `${target.fullName} fue eliminado. El motivo quedó registrado.`,
            life: 4000
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
