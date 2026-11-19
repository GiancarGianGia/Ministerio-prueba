import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/services/auth.service';
import { PASSWORD_CONFIRMATION_LABEL, PASSWORD_REQUIREMENTS, composeDocumentNumber, missingPasswordRequirements, stripDocumentPrefix, validateIdentityDocument, validatePassword, validatePasswordConfirmation } from '@/app/services/validators';
import { DocumentPrefixSelect } from '@/app/components/document-prefix-select/document-prefix-select';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, DialogModule, DocumentPrefixSelect, InputTextModule, PasswordModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="auth-page">
            <div class="auth-shell">
                <section class="auth-brand">
                    <div class="auth-brand-header">
                        <div class="auth-logo"><i class="pi pi-id-card"></i></div>
                        <div>
                            <span class="auth-logo-text">MPPPST</span>
                            <span class="auth-logo-subtitle">Proceso Social de Trabajo</span>
                        </div>
                    </div>

                    <div class="auth-brand-body">
                        <span class="auth-kicker">Ministerio del Poder Popular para el Proceso Social de Trabajo · Caracas</span>
                        <h1>Gestiona y actualiza la información de los trabajadores del ministerio en un solo lugar.</h1>
                        <p>Un espacio seguro para actualizar la información de los trabajadores, los usuarios administradores y la trazabilidad de cada movimiento.</p>

                        <ul class="auth-benefits">
                            <li><i class="pi pi-check-circle"></i><span>Consulta y actualización de datos de los trabajadores del ministerio.</span></li>
                            <li><i class="pi pi-check-circle"></i><span>Usuarios con rol de administrador para la gestión y modificación de trabajadores.</span></li>
                            <li><i class="pi pi-check-circle"></i><span>Bitácora automática con fecha y hora de cada acción realizada.</span></li>
                        </ul>
                    </div>

                    <div class="auth-brand-footer">
                        <i class="pi pi-shield"></i>
                        <span>Acceso protegido y actividad registrada</span>
                    </div>
                </section>

                <section class="auth-form-panel">
                    <div class="auth-form-inner">
                        <div class="auth-form-header">
                            <span class="page-eyebrow">Bienvenido</span>
                            <h2>Iniciar sesión</h2>
                            <p>Ingresa con tu cuenta para administrar y actualizar la información de los trabajadores.</p>
                        </div>

                        <form class="auth-form" (ngSubmit)="submit()">
                            <label for="cedula">Documento de identidad</label>
                            <div class="doc-input-row">
                                <app-document-prefix-select name="cedulaPrefix" [(ngModel)]="cedulaPrefix" (ngModelChange)="cedulaTouched = true" />
                                <input
                                    pInputText
                                    id="cedula"
                                    name="cedula"
                                    type="text"
                                    [(ngModel)]="cedula"
                                    (ngModelChange)="cedulaTouched = true"
                                    placeholder="12345678"
                                    autocomplete="username"
                                    required
                                />
                            </div>
                            @if (cedulaTouched && cedulaError()) {
                                <small class="field-error">{{ cedulaError() }}</small>
                            }

                            <label for="password">Contraseña</label>
                            <p-password
                                inputId="password"
                                name="password"
                                [ngModel]="password"
                                (ngModelChange)="password = $event.toUpperCase()"
                                [toggleMask]="true"
                                [feedback]="false"
                                [fluid]="true"
                                placeholder="Tu contraseña"
                                autocomplete="current-password"
                            />

                            <div style="display: flex; justify-content: flex-end; margin: 0.2rem 0 0.3rem;">
                                <button type="button" class="auth-link" (click)="openForgotDialog()">¿Olvidaste tu contraseña?</button>
                            </div>

                            @if (error) {
                                <div class="auth-error">
                                    <i class="pi pi-exclamation-circle"></i>
                                    <span>{{ error }}</span>
                                </div>
                            }

                            <p-button type="submit" label="Ingresar al sistema" icon="pi pi-sign-in" styleClass="w-full" [loading]="loading" />
                        </form>

                        <p class="auth-switch">¿No tienes cuenta? <a routerLink="/auth/registro">Crear una cuenta</a></p>
                    </div>
                </section>
            </div>
        </div>

        <!-- DIÁLOGO RECUPERAR CONTRASEÑA (3 pasos) -->
        <p-dialog [(visible)]="forgotDialog" [header]="forgotDialogHeader" [modal]="true" [style]="{ width: '440px', maxWidth: '95vw' }" (onHide)="resetForgotState()">
            <div class="auth-form" style="gap: 0.75rem;">

                <!-- PASO 1: Ingresar cédula -->
                @if (forgotStep === 1) {
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 0.5rem;">
                        Selecciona el tipo de documento e ingresa tu número para verificar tu identidad.
                    </p>
                    <div>
                        <label for="forgotCedula">Documento de identidad *</label>
                        <div class="doc-input-row">
                            <app-document-prefix-select [(ngModel)]="forgotCedulaPrefix" (ngModelChange)="forgotCedulaTouched = true" />
                            <input
                                pInputText
                                id="forgotCedula"
                                [(ngModel)]="forgotCedula"
                                (ngModelChange)="forgotCedulaTouched = true"
                                placeholder="12345678"
                                style="width: 100%"
                            />
                        </div>
                        @if (forgotCedulaTouched && forgotCedulaError()) {
                            <small class="field-error">{{ forgotCedulaError() }}</small>
                        }
                    </div>
                }

                <!-- PASO 2: Responder preguntas de seguridad -->
                @if (forgotStep === 2) {
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 0.75rem;">
                        Responde tus preguntas de seguridad para continuar.
                    </p>
                    @for (q of forgotQuestions; track $index) {
                        <div class="security-question-field" [class.is-incorrect]="isForgotQuestionIncorrect(q)">
                            <label>{{ q }}</label>
                            <div class="secret-input">
                                <input
                                    pInputText
                                    [type]="forgotAnswerVisible[$index] ? 'text' : 'password'"
                                    [ngModel]="forgotAnswers[$index]"
                                    (ngModelChange)="onForgotAnswerChange($index, $event)"
                                    placeholder="Tu respuesta..."
                                    autocomplete="off"
                                />
                                <button
                                    type="button"
                                    class="secret-input-toggle"
                                    [attr.aria-label]="forgotAnswerVisible[$index] ? 'Ocultar respuesta' : 'Mostrar respuesta'"
                                    [attr.title]="forgotAnswerVisible[$index] ? 'Ocultar respuesta' : 'Mostrar respuesta'"
                                    [disabled]="!forgotAnswers[$index]"
                                    (click)="toggleForgotAnswerVisibility($index)"
                                >
                                    <i class="pi" [class.pi-eye]="!forgotAnswerVisible[$index]" [class.pi-eye-slash]="forgotAnswerVisible[$index]"></i>
                                </button>
                            </div>
                        </div>
                    }
                }

                <!-- PASO 3: Nueva contraseña -->
                @if (forgotStep === 3) {
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 0.5rem;">
                        Escribe tu nueva contraseña.
                    </p>
                    <div>
                        <label for="forgotNewPassword">Nueva contraseña *</label>
                        <div class="password-field" [class.is-invalid]="forgotPasswordHasIssues()">
                            <p-password
                                inputId="forgotNewPassword"
                                [ngModel]="forgotNewPassword"
                                (ngModelChange)="forgotNewPassword = $event"
                                [toggleMask]="true"
                                [feedback]="false"
                                [fluid]="true"
                                placeholder="Más de 8 caracteres"
                            />
                            <ul class="password-rules">
                                @for (rule of passwordRequirements; track rule.key) {
                                    <li [class.is-met]="rule.test(forgotNewPassword)" [class.is-missing]="forgotPasswordHasIssues() && !rule.test(forgotNewPassword)">{{ rule.label }}</li>
                                }
                                <li [class.is-met]="forgotPasswordsMatch()" [class.is-missing]="forgotPasswordHasIssues() && !forgotPasswordsMatch()">{{ passwordConfirmationLabel }}</li>
                            </ul>
                        </div>
                    </div>
                    <div>
                        <label for="forgotConfirmPassword">Confirmar contraseña *</label>
                        <p-password
                            inputId="forgotConfirmPassword"
                            [ngModel]="forgotConfirmPassword"
                            (ngModelChange)="forgotConfirmPassword = $event"
                            [toggleMask]="true"
                            [feedback]="false"
                            [fluid]="true"
                            placeholder="Repite la nueva contraseña"
                        />
                    </div>
                    @if (forgotPasswordHasIssues()) {
                        <p class="password-missing-summary">Te falta cumplir: {{ missingForgotPasswordRules().join('; ') }}.</p>
                    }
                }

                @if (forgotError) {
                    <div class="auth-error">
                        <i class="pi pi-exclamation-circle"></i>
                        <span>{{ forgotError }}</span>
                    </div>
                }
            </div>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [outlined]="true" styleClass="btn-cancelar" (click)="forgotDialog = false" />
                @if (forgotStep === 1) {
                    <p-button label="Continuar" icon="pi pi-arrow-right" iconPos="right" [loading]="forgotLoading" (click)="forgotStep1()" />
                }
                @if (forgotStep === 2) {
                    <p-button label="Verificar respuestas" icon="pi pi-shield" [loading]="forgotLoading" (click)="forgotStep2()" />
                }
                @if (forgotStep === 3) {
                    <p-button label="Restablecer contraseña" icon="pi pi-check" [loading]="forgotLoading" (click)="forgotStep3()" />
                }
            </ng-template>
        </p-dialog>
    `
})
export class Login {
    private readonly auth = inject(AuthService);

    private readonly router = inject(Router);

    private readonly messageService = inject(MessageService);

    cedula = '';
    cedulaPrefix = '';
    cedulaTouched = false;
    password = '';
    error = '';
    loading = false;

    forgotDialog = false;
    forgotStep = 1;
    forgotCedula = '';
    forgotCedulaPrefix = '';
    forgotCedulaTouched = false;
    forgotQuestions: string[] = [];
    forgotAnswers: string[] = [];
    forgotAnswerVisible: boolean[] = [];
    forgotIncorrectQuestions = new Set<string>();
    forgotNewPassword = '';
    forgotConfirmPassword = '';
    forgotError = '';
    forgotLoading = false;

    readonly passwordRequirements = PASSWORD_REQUIREMENTS;

    readonly passwordConfirmationLabel = PASSWORD_CONFIRMATION_LABEL;

    get forgotDialogHeader(): string {
        switch (this.forgotStep) {
            case 1: return 'Recuperar contraseña — Paso 1 de 3';
            case 2: return 'Recuperar contraseña — Paso 2 de 3';
            case 3: return 'Recuperar contraseña — Paso 3 de 3';
            default: return 'Recuperar contraseña';
        }
    }

    constructor() {
        if (this.auth.currentUser()) {
            this.router.navigate(['/']);
        }
    }

    cedulaError(): string {
        return validateIdentityDocument(this.cedulaPrefix, this.cedula) ?? '';
    }

    forgotCedulaError(): string {
        return validateIdentityDocument(this.forgotCedulaPrefix, this.forgotCedula) ?? '';
    }

    private currentDocument(): string {
        return composeDocumentNumber(this.cedulaPrefix, this.cedula);
    }

    private forgotDocument(): string {
        return composeDocumentNumber(this.forgotCedulaPrefix, this.forgotCedula);
    }

    submit(): void {
        this.error = '';
        if (!this.cedulaPrefix || !this.cedula.trim() || !this.password) {
            this.error = 'Selecciona el tipo de documento, escribe tu cédula y tu contraseña.';
            return;
        }
        const cedulaError = validateIdentityDocument(this.cedulaPrefix, this.cedula);
        if (cedulaError) {
            this.error = cedulaError;
            return;
        }
        this.loading = true;
        const result = this.auth.login(this.currentDocument(), this.password);
        if (!result.ok) {
            this.error = result.message;
            this.loading = false;
            return;
        }
        this.router.navigate(['/']);
    }

    openForgotDialog(): void {
        this.resetForgotState();
        this.forgotCedulaPrefix = this.cedulaPrefix;
        this.forgotCedula = stripDocumentPrefix(this.cedula);
        this.forgotDialog = true;
    }

    resetForgotState(): void {
        this.forgotStep = 1;
        this.forgotCedula = '';
        this.forgotCedulaPrefix = '';
        this.forgotCedulaTouched = false;
        this.forgotQuestions = [];
        this.forgotAnswers = [];
        this.forgotAnswerVisible = [];
        this.forgotIncorrectQuestions.clear();
        this.forgotNewPassword = '';
        this.forgotConfirmPassword = '';
        this.forgotError = '';
        this.forgotLoading = false;
    }

    forgotStep1(): void {
        this.forgotError = '';
        this.forgotCedulaTouched = true;
        const cedulaErr = this.forgotCedulaError();
        if (cedulaErr) { this.forgotError = cedulaErr; return; }

        this.forgotLoading = true;
        const result = this.auth.getSecurityQuestions(this.forgotDocument());
        this.forgotLoading = false;

        if (!result.ok) { this.forgotError = result.message; return; }

        if (result.questions.length === 0) {
            this.forgotQuestions = [];
            this.forgotAnswers = [];
            this.forgotAnswerVisible = [];
            this.forgotStep = 3;
        } else {
            this.forgotQuestions = result.questions;
            this.forgotAnswers = result.questions.map(() => '');
            this.forgotAnswerVisible = result.questions.map(() => false);
            this.forgotIncorrectQuestions.clear();
            this.forgotStep = 2;
        }
    }

    forgotStep2(): void {
        this.forgotError = '';
        if (this.forgotAnswers.some((a) => !a.trim())) {
            this.forgotError = 'Debes responder todas las preguntas de seguridad.';
            return;
        }

        this.forgotLoading = true;
        const answeredQuestions = this.forgotQuestions.map((question, index) => ({
            question,
            answer: this.forgotAnswers[index]
        }));
        const result = this.auth.verifySecurityQuestions(this.forgotDocument(), answeredQuestions);
        this.forgotLoading = false;

        if (!result.ok) {
            this.forgotError = result.message;
            this.forgotIncorrectQuestions = new Set(result.incorrectQuestions ?? []);
            return;
        }

        this.forgotIncorrectQuestions.clear();
        this.forgotStep = 3;
    }

    toggleForgotAnswerVisibility(index: number): void {
        this.forgotAnswerVisible[index] = !this.forgotAnswerVisible[index];
    }

    isForgotQuestionIncorrect(question: string): boolean {
        return this.forgotIncorrectQuestions.has(question);
    }

    onForgotAnswerChange(index: number, value: string): void {
        this.forgotAnswers[index] = (value ?? '').toUpperCase();
        this.forgotIncorrectQuestions.delete(this.forgotQuestions[index]);
    }

    forgotPasswordsMatch(): boolean {
        return !!this.forgotNewPassword && this.forgotNewPassword === this.forgotConfirmPassword;
    }

    missingForgotPasswordRules(): string[] {
        const missing = missingPasswordRequirements(this.forgotNewPassword);
        if (!this.forgotPasswordsMatch()) {
            missing.push(this.passwordConfirmationLabel);
        }
        return missing;
    }

    forgotPasswordHasIssues(): boolean {
        return (this.forgotNewPassword.length > 0 || this.forgotConfirmPassword.length > 0) && this.missingForgotPasswordRules().length > 0;
    }

    forgotStep3(): void {
        this.forgotError = '';

        const passErr = validatePassword(this.forgotNewPassword);
        if (passErr) { this.forgotError = passErr; return; }

        const confirmErr = validatePasswordConfirmation(this.forgotNewPassword, this.forgotConfirmPassword);
        if (confirmErr) { this.forgotError = confirmErr; return; }

        this.forgotLoading = true;

        const answeredQuestions = this.forgotQuestions.map((q, i) => ({
            question: q,
            answer: this.forgotAnswers[i]
        }));

        const result = this.auth.resetPassword(
            this.forgotDocument(),
            this.forgotNewPassword,
            answeredQuestions.length > 0 ? answeredQuestions : undefined
        );

        this.forgotLoading = false;

        if (!result.ok) {
            this.forgotError = result.message;
            this.forgotIncorrectQuestions = new Set(result.incorrectQuestions ?? []);
            if (this.forgotQuestions.length > 0) {
                this.forgotStep = 2;
            }
            return;
        }

        this.cedulaPrefix = this.forgotCedulaPrefix;
        this.cedula = stripDocumentPrefix(this.forgotCedula);
        this.password = '';
        this.forgotDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Contraseña restablecida',
            detail: 'Tu contraseña se actualizó correctamente. Inicia sesión con tu nueva contraseña.',
            life: 4000
        });
    }
}
