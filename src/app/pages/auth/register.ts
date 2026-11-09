import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '@/app/services/auth.service';
import { validateEmail, validatePassword, validatePasswordConfirmation } from '@/app/services/validators';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, PasswordModule],
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
                        <h1>Crea tu usuario y empieza a registrar trabajadores.</h1>
                        <p>Las cuentas creadas desde aquí se agregan automáticamente al sistema con el rol de registrador.</p>

                        <div class="auth-steps">
                            <div class="auth-step">
                                <span>1</span>
                                <div><strong>Completa tus datos</strong><small>Nombre, correo y una contraseña segura.</small></div>
                            </div>
                            <div class="auth-step">
                                <span>2</span>
                                <div><strong>Accede al sistema</strong><small>Tu cuenta queda activa de inmediato.</small></div>
                            </div>
                            <div class="auth-step">
                                <span>3</span>
                                <div><strong>Registra trabajadores</strong><small>La creación de tu usuario quedará en la bitácora.</small></div>
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

                            <label for="email">Correo electrónico *</label>
                            <input pInputText id="email" name="email" type="email" [(ngModel)]="email" placeholder="nombre@mpppst.gob.ve" autocomplete="email" />
                            @if (submitted && emailError()) {
                                <small class="field-error">{{ emailError() }}</small>
                            }

                            <div class="auth-form-row">
                                <div>
                                    <label for="password">Contraseña *</label>
                                    <p-password
                                        inputId="password"
                                        name="password"
                                        [(ngModel)]="password"
                                        [toggleMask]="true"
                                        [feedback]="true"
                                        [fluid]="true"
                                        placeholder="Mínimo 6 caracteres"
                                        autocomplete="new-password"
                                        promptLabel="Elige una contraseña"
                                        weakLabel="Débil"
                                        mediumLabel="Media"
                                        strongLabel="Fuerte"
                                    />
                                    <small class="auth-hint">Mínimo 6 caracteres con letras y números.</small>
                                    @if (submitted && passwordError()) {
                                        <small class="field-error">{{ passwordError() }}</small>
                                    }
                                </div>
                                <div>
                                    <label for="confirmPassword">Confirmar contraseña *</label>
                                    <p-password
                                        inputId="confirmPassword"
                                        name="confirmPassword"
                                        [(ngModel)]="confirmPassword"
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

                            <p-button type="submit" label="Crear cuenta y entrar" icon="pi pi-user-plus" styleClass="w-full" [loading]="loading" />
                        </form>

                        <div class="auth-note">
                            <i class="pi pi-info-circle"></i>
                            <span>El auto-registro asigna el rol <strong>Registrador</strong>. Un administrador puede cambiarlo desde la sección Usuarios.</span>
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

    email = '';

    password = '';

    confirmPassword = '';

    error = '';

    loading = false;

    submitted = false;

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
        const name = this.fullName.trim();
        if (!name) {
            return 'El nombre completo es obligatorio.';
        }
        if (name.length < 3) {
            return 'Escribe el nombre completo (mínimo 3 caracteres).';
        }
        return '';
    }

    emailError(): string {
        return validateEmail(this.email) ?? '';
    }

    passwordError(): string {
        return validatePassword(this.password) ?? '';
    }

    confirmPasswordError(): string {
        return validatePasswordConfirmation(this.password, this.confirmPassword) ?? '';
    }

    submit(): void {
        this.submitted = true;
        this.error = '';

        const nameErr = this.fullNameError();
        if (nameErr) {
            this.error = nameErr;
            return;
        }

        const emailErr = this.emailError();
        if (emailErr) {
            this.error = emailErr;
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
        const result = this.auth.register(this.fullName, this.email, this.password);

        if (!result.ok) {
            this.error = result.message;
            this.loading = false;
            return;
        }

        this.router.navigate(['/']);
    }
}
