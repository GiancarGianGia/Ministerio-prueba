import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '@/app/services/auth.service';
import { PASSWORD_CONFIRMATION_LABEL, PASSWORD_REQUIREMENTS, composeDocumentNumber, missingPasswordRequirements, validateIdentityDocument, validatePassword, validatePasswordConfirmation, validatePersonName } from '@/app/services/validators';
import { DocumentPrefixSelect } from '@/app/components/document-prefix-select/document-prefix-select';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, DocumentPrefixSelect, InputTextModule, PasswordModule],
    template: `
        <div class="auth-page">
            <div class="auth-shell">
                <section class="auth-brand">
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
                                <div><strong>Completa tus datos</strong><small>Nombre, cédula y una contraseña segura.</small></div>
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

                    <div class="auth-brand-footer">
                        <i class="pi pi-lock"></i>
                        <span>La información se guarda en este navegador</span>
                    </div>
                </section>

                <section class="auth-form-panel">
                    <div class="auth-form-inner">
                        <button type="button" class="auth-back-button" (click)="goToLogin()">
                            <i class="pi pi-arrow-left"></i>
                            <span>Volver a iniciar sesión</span>
                        </button>

                        <div class="auth-form-header">
                            <span class="page-eyebrow">Crear cuenta</span>
                            <h2>Registro de usuario</h2>
                            <p>Completa el formulario para crear tu acceso.</p>
                        </div>

                        <form class="auth-form" (ngSubmit)="submit()">
                            <label for="fullName">Nombre completo *</label>
                            <input pInputText id="fullName" name="fullName" type="text" [(ngModel)]="fullName" placeholder="Nombre y apellidos" autocomplete="name" />
                            @if (submitted && fullNameError()) {
                                <small class="field-error">{{ fullNameError() }}</small>
                            }

                            <label for="cedula">Documento de identidad *</label>
                            <div class="doc-input-row">
                                <app-document-prefix-select name="cedulaPrefix" [(ngModel)]="cedulaPrefix" (ngModelChange)="cedulaTouched = true" />
                                <input pInputText id="cedula" name="cedula" type="text" [(ngModel)]="cedula" (ngModelChange)="cedulaTouched = true" placeholder="12345678" autocomplete="username" />
                            </div>
                            @if ((submitted || cedulaTouched) && cedulaError()) {
                                <small class="field-error">{{ cedulaError() }}</small>
                            }
                            @if (!((submitted || cedulaTouched) && cedulaError())) {
                                <small class="field-hint">La cédula debe llevar el tipo de documento y el número sin puntos (ej. V-18745632).</small>
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
                                                <li [class.is-met]="rule.test(password)" [class.is-missing]="!rule.test(password)">{{ rule.label }}</li>
                                            }
                                            <li [class.is-met]="passwordsMatch()" [class.is-missing]="!passwordsMatch()">{{ passwordConfirmationLabel }}</li>
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

        this.loading = true;
        const result = this.auth.register(this.fullName, composeDocumentNumber(this.cedulaPrefix, this.cedula), this.password);

        if (!result.ok) {
            this.error = result.message;
            this.loading = false;
            return;
        }

        this.router.navigate(['/']);
    }
}
