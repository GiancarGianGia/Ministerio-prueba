import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { AuthService } from '@/app/services/auth.service';
import { SECURITY_QUESTIONS, SecurityQuestion, SelectOption } from '@/app/services/models';
import { PASSWORD_CONFIRMATION_LABEL, PASSWORD_REQUIREMENTS, composeDocumentNumber, missingPasswordRequirements, validateIdentityDocument, validatePassword, validatePasswordConfirmation, validatePersonName } from '@/app/services/validators';
import { DocumentPrefixSelect } from '@/app/components/document-prefix-select/document-prefix-select';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, DialogModule, DocumentPrefixSelect, InputTextModule, PasswordModule, SelectModule],
    styles: [
        `
            .auth-brand-compact {
                justify-content: flex-start;
            }

            .auth-brand-compact .auth-brand-body {
                margin-block: auto;
            }
        `
    ],
    template: `
        <div class="auth-page">
            <div class="auth-shell">
                <section class="auth-brand auth-brand-compact">
                    <div class="auth-brand-header">
                        <div class="auth-logo"><i class="pi pi-user-plus"></i></div>
                        <div>
                            <span class="auth-logo-text">MPPPST</span>
                            <span class="auth-logo-subtitle">Proceso Social de Trabajo</span>
                        </div>
                    </div>

                    <div class="auth-brand-body">
                        <span class="auth-kicker">Nueva cuenta</span>
                        <h1>Crea tu usuario administrador y gestiona a los trabajadores.</h1>
                        <p>Las cuentas creadas desde aquí se agregan automáticamente al sistema con el rol de administrador.</p>

                        <div class="auth-steps">
                            <div class="auth-step">
                                <span>1</span>
                                <div><strong>Completa tus datos</strong><small>Nombre, cédula, contraseña y preguntas de seguridad.</small></div>
                            </div>
                            <div class="auth-step">
                                <span>2</span>
                                <div><strong>Accede al sistema</strong><small>Tu cuenta queda activa de inmediato.</small></div>
                            </div>
                            <div class="auth-step">
                                <span>3</span>
                                <div><strong>Gestiona trabajadores</strong><small>Podrás consultar y actualizar información.</small></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="auth-form-panel">
                    <div class="auth-form-inner">
                        <button type="button" class="auth-back-button" (click)="goToLogin()">
                            <i class="pi pi-arrow-left"></i>
                            <span>Volver a iniciar sesión</span>
                        </button>

                        <div class="auth-form-header">
                            <h2>Crear cuenta</h2>
                            <p>Completa el formulario para crear tu acceso.</p>
                        </div>

                        <form class="auth-form" (ngSubmit)="submit()">
                            <label for="fullName">Nombre completo *</label>
                            <input pInputText id="fullName" name="fullName" type="text" [(ngModel)]="fullName" placeholder="Nombre y apellidos" autocomplete="name" />
                            @if (submitted && fullNameError()) {
                                <small class="field-error">{{ fullNameError() }}</small>
                            }

                            <label for="cedula">Nro. de documento *</label>
                            <div class="doc-input-row">
                                <app-document-prefix-select name="cedulaPrefix" [(ngModel)]="cedulaPrefix" (ngModelChange)="cedulaTouched = true" />
                                <input pInputText id="cedula" name="cedula" type="text" [(ngModel)]="cedula" (ngModelChange)="cedulaTouched = true" placeholder="12345678" autocomplete="username" />
                            </div>
                            @if ((submitted || cedulaTouched) && cedulaError()) {
                                <small class="field-error">{{ cedulaError() }}</small>
                            }
                            @if (!((submitted || cedulaTouched) && cedulaError())) {
                                <small class="field-hint">Selecciona el tipo de documento e ingresa el nro. de documento (ej. V-18745632).</small>
                            }

                            <div class="auth-form-row">
                                <div>
                                    <label for="password">Contraseña *</label>
                                    <div class="password-field" [class.is-invalid]="passwordHasIssues()">
                                        <p-password
                                            inputId="password"
                                            name="password"
                                            [ngModel]="password"
                                            (ngModelChange)="password = $event"
                                            [toggleMask]="true"
                                            [feedback]="false"
                                            [fluid]="true"
                                            placeholder="Más de 8 caracteres"
                                            autocomplete="new-password"
                                        />
                                        <ul class="password-rules">
                                            @for (rule of passwordRequirements; track rule.key) {
                                                <li [class.is-met]="rule.test(password)" [class.is-missing]="passwordHasIssues() && !rule.test(password)">{{ rule.label }}</li>
                                            }
                                            <li [class.is-met]="passwordsMatch()" [class.is-missing]="passwordHasIssues() && !passwordsMatch()">{{ passwordConfirmationLabel }}</li>
                                        </ul>
                                    </div>
                                    @if (submitted && passwordError()) {
                                        <small class="field-error">{{ passwordError() }}</small>
                                    }
                                </div>
                                <div>
                                    <label for="confirmPassword">Confirmar contraseña *</label>
                                    <p-password
                                        inputId="confirmPassword"
                                        name="confirmPassword"
                                        [ngModel]="confirmPassword"
                                        (ngModelChange)="confirmPassword = $event"
                                        [toggleMask]="true"
                                        [feedback]="false"
                                        [fluid]="true"
                                        placeholder="Repite la contraseña"
                                        autocomplete="new-password"
                                    />
                                    @if (submitted && confirmPasswordError()) {
                                        <small class="field-error">{{ confirmPasswordError() }}</small>
                                    }
                                </div>
                            </div>

                            <section class="security-questions-section" aria-labelledby="registerSecurityTitle">
                                <div class="security-questions-header">
                                    <div>
                                        <h3 id="registerSecurityTitle" class="security-questions-title">
                                            <i class="pi pi-shield" aria-hidden="true"></i>
                                            Preguntas de seguridad *
                                        </h3>
                                        <p class="security-questions-description">
                                            Se usarán para verificar tu identidad si olvidas la contraseña.
                                        </p>
                                    </div>
                                    <p-button
                                        type="button"
                                        [label]="hasSecurityQuestions() ? 'Editar' : 'Configurar'"
                                        [icon]="hasSecurityQuestions() ? 'pi pi-pencil' : 'pi pi-plus'"
                                        severity="secondary"
                                        [outlined]="true"
                                        (onClick)="openSecurityDialog()"
                                    />
                                </div>

                                @if (hasSecurityQuestions()) {
                                    <ul class="security-summary">
                                        @for (sq of securityQuestions(); track sq.question) {
                                            <li>
                                                <i class="pi pi-check-circle" aria-hidden="true"></i>
                                                <span>{{ sq.question }}</span>
                                            </li>
                                        }
                                    </ul>
                                } @else {
                                    <p class="security-summary-empty">
                                        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                                        <span>Aún no has configurado tus preguntas de seguridad.</span>
                                    </p>
                                }
                            </section>

                            @if (error) {
                                <div class="auth-error">
                                    <i class="pi pi-exclamation-circle"></i>
                                    <span>{{ error }}</span>
                                </div>
                            }

                            @if (passwordHasIssues()) {
                                <p class="password-missing-summary">Te falta cumplir: {{ missingPasswordRules().join('; ') }}.</p>
                            }

                            <p-button type="submit" label="Crear cuenta y entrar" icon="pi pi-user-plus" styleClass="w-full" [loading]="loading" />
                        </form>

                        <p-dialog
                            [(visible)]="securityDialogVisible"
                            header="Preguntas de seguridad"
                            [modal]="true"
                            [draggable]="false"
                            [resizable]="false"
                            [style]="{ width: 'min(34rem, 92vw)' }"
                            styleClass="security-dialog"
                            (onHide)="onSecurityDialogHide()"
                        >
                            <p class="security-questions-description">
                                Configura hasta 3 preguntas de seguridad. La primera es obligatoria y las demás opcionales.
                            </p>

                            @for (sq of securityDraft; track $index) {
                                <div class="security-question-card" [class.is-invalid]="!!securityQuestionError($index)">
                                    <label class="security-question-label" [for]="'securityQuestion' + $index">
                                        Pregunta {{ $index + 1 }} {{ $index === 0 ? '*' : '(opcional)' }}
                                    </label>
                                    <p-select
                                        [inputId]="'securityQuestion' + $index"
                                        [options]="availableQuestionsFor($index)"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Selecciona una pregunta..."
                                        [(ngModel)]="securityDraft[$index].question"
                                        appendTo="body"
                                        [showClear]="true"
                                        styleClass="w-full"
                                    />
                                    <label class="security-question-label security-answer-label" [for]="'securityAnswer' + $index">Respuesta</label>
                                    <div class="secret-input">
                                        <input
                                            pInputText
                                            [id]="'securityAnswer' + $index"
                                            [type]="securityAnswerVisible[$index] ? 'text' : 'password'"
                                            [ngModel]="securityDraft[$index].answer"
                                            (ngModelChange)="onSecurityAnswerChange($index, $event)"
                                            [disabled]="!securityDraft[$index].question"
                                            placeholder="Selecciona una pregunta y escribe tu respuesta"
                                            autocomplete="off"
                                        />
                                        <button
                                            type="button"
                                            class="secret-input-toggle"
                                            [attr.aria-label]="securityAnswerVisible[$index] ? 'Ocultar respuesta' : 'Mostrar respuesta'"
                                            [attr.title]="securityAnswerVisible[$index] ? 'Ocultar respuesta' : 'Mostrar respuesta'"
                                            [disabled]="!securityDraft[$index].answer"
                                            (click)="toggleSecurityAnswerVisibility($index)"
                                        >
                                            <i class="pi" [class.pi-eye]="!securityAnswerVisible[$index]" [class.pi-eye-slash]="securityAnswerVisible[$index]"></i>
                                        </button>
                                    </div>
                                    @if (securityQuestionError($index)) {
                                        <small class="field-error">{{ securityQuestionError($index) }}</small>
                                    }
                                </div>
                            }

                            <ng-template #footer>
                                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [outlined]="true" (onClick)="closeSecurityDialog()" />
                                <p-button label="Guardar preguntas" icon="pi pi-check" (onClick)="saveSecurityQuestions()" />
                            </ng-template>
                        </p-dialog>

                        <div class="auth-note">
                            <i class="pi pi-info-circle"></i>
                            <span>El auto-registro asigna el rol <strong>Administrador</strong> por defecto con acceso completo para gestionar trabajadores y usuarios.</span>
                        </div>

                        <p class="auth-switch">¿Ya tienes cuenta? <a routerLink="/auth/login" (click)="goToLogin($event)">Iniciar sesión</a></p>
                    </div>
                </section>
            </div>
        </div>
    `
})
export class Register {
    private readonly auth = inject(AuthService);

    private readonly router = inject(Router);

    fullName = '';

    cedula = '';

    cedulaPrefix = '';

    password = '';

    confirmPassword = '';

    error = '';

    loading = false;

    submitted = false;

    cedulaTouched = false;

    readonly securityQuestionOptions: SelectOption[] = SECURITY_QUESTIONS.map((q) => ({ label: q, value: q }));

    securityQuestionsForm: { question: string; answer: string }[] = [
        { question: '', answer: '' },
        { question: '', answer: '' },
        { question: '', answer: '' }
    ];

    securityAnswerVisible: boolean[] = [false, false, false];

    securityDialogVisible = false;

    securityDialogSubmitted = false;

    securityDraft: { question: string; answer: string }[] = this.emptySecurityForm();

    readonly passwordRequirements = PASSWORD_REQUIREMENTS;

    readonly passwordConfirmationLabel = PASSWORD_CONFIRMATION_LABEL;

    constructor() {
        if (this.auth.currentUser()) {
            this.router.navigate(['/']);
        }
    }

    goToLogin(event?: Event): void {
        if (event) {
            event.preventDefault();
        }
        this.router.navigate(['/auth/login']);
    }

    fullNameError(): string {
        return this.submitted ? (validatePersonName(this.fullName, 'nombre completo', { allowMultipleWords: true }) ?? '') : '';
    }

    cedulaError(): string {
        return validateIdentityDocument(this.cedulaPrefix, this.cedula) ?? '';
    }

    passwordError(): string {
        return validatePassword(this.password) ?? '';
    }

    confirmPasswordError(): string {
        return validatePasswordConfirmation(this.password, this.confirmPassword) ?? '';
    }

    passwordsMatch(): boolean {
        return !!this.password && this.password === this.confirmPassword;
    }

    missingPasswordRules(): string[] {
        const missing = missingPasswordRequirements(this.password);
        if (!this.passwordsMatch()) {
            missing.push(this.passwordConfirmationLabel);
        }
        return missing;
    }

    passwordHasIssues(): boolean {
        return (this.password.length > 0 || this.confirmPassword.length > 0) && this.missingPasswordRules().length > 0;
    }

    openSecurityDialog(): void {
        this.securityDraft = this.securityQuestionsForm.map((q) => ({ ...q }));
        this.securityAnswerVisible = [false, false, false];
        this.securityDialogSubmitted = false;
        this.securityDialogVisible = true;
    }

    closeSecurityDialog(): void {
        this.securityDialogVisible = false;
    }

    onSecurityDialogHide(): void {
        this.securityDraft = this.emptySecurityForm();
        this.securityDialogSubmitted = false;
        this.securityAnswerVisible = [false, false, false];
    }

    saveSecurityQuestions(): void {
        this.securityDialogSubmitted = true;

        if (this.securityQuestionsError()) {
            return;
        }

        this.securityQuestionsForm = this.securityDraft.map((q) => ({ question: q.question, answer: q.answer.trim() }));
        this.securityDialogVisible = false;
    }

    hasSecurityQuestions(): boolean {
        const first = this.securityQuestionsForm[0];
        return !!first?.question && !!first.answer.trim();
    }

    securityQuestionError(index: number): string {
        if (!this.securityDialogSubmitted) return '';
        const q = this.securityDraft[index];
        if (!q.question) {
            if (index === 0) return 'Selecciona la primera pregunta de seguridad.';
            return q.answer.trim() ? 'Selecciona la pregunta correspondiente a esta respuesta.' : '';
        }
        if (!q.answer.trim()) {
            return 'Escribe la respuesta para esta pregunta.';
        }
        return '';
    }

    securityQuestionsError(): string {
        for (let index = 0; index < this.securityDraft.length; index += 1) {
            const error = this.securityQuestionError(index);
            if (error) {
                return error;
            }
        }
        return '';
    }

    toggleSecurityAnswerVisibility(index: number): void {
        this.securityAnswerVisible[index] = !this.securityAnswerVisible[index];
    }

    onSecurityAnswerChange(index: number, value: string): void {
        this.securityDraft[index].answer = (value ?? '').toUpperCase();
    }

    availableQuestionsFor(index: number): SelectOption[] {
        const usedQuestions = this.securityDraft
            .filter((_, i) => i !== index)
            .map((q) => q.question)
            .filter(Boolean);
        return this.securityQuestionOptions.filter((opt) => !usedQuestions.includes(opt.value));
    }

    securityQuestions(): SecurityQuestion[] {
        return this.securityQuestionsForm
            .filter((q) => q.question && q.answer.trim())
            .map((q) => ({ question: q.question, answer: q.answer.trim() }));
    }

    private emptySecurityForm(): { question: string; answer: string }[] {
        return [
            { question: '', answer: '' },
            { question: '', answer: '' },
            { question: '', answer: '' }
        ];
    }

    submit(): void {
        this.submitted = true;
        this.error = '';

        const nameErr = this.fullNameError();
        if (nameErr) {
            this.error = nameErr;
            return;
        }

        const cedulaErr = this.cedulaError();
        if (cedulaErr) {
            this.error = cedulaErr;
            return;
        }

        const passErr = this.passwordError();
        if (passErr) {
            this.error = passErr;
            return;
        }

        const confirmErr = this.confirmPasswordError();
        if (confirmErr) {
            this.error = confirmErr;
            return;
        }

        if (!this.hasSecurityQuestions()) {
            this.error = 'Configura al menos una pregunta de seguridad antes de crear la cuenta.';
            this.openSecurityDialog();
            return;
        }

        this.loading = true;
        const result = this.auth.register(this.fullName, composeDocumentNumber(this.cedulaPrefix, this.cedula), this.password, this.securityQuestions());

        if (!result.ok) {
            this.error = result.message;
            this.loading = false;
            return;
        }

        this.router.navigate(['/']);
    }
}
