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
import { validateCedula, validatePassword, validatePasswordConfirmation } from '@/app/services/validators';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, DialogModule, InputTextModule, PasswordModule, ToastModule],
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
                            <p>Ingresa con tu cuenta para administrar el registro de trabajadores.</p>
                        </div>

                        <form class="auth-form" (ngSubmit)="submit()">
                            <label for="cedula">Cédula</label>
                            <input
                                pInputText
                                id="cedula"
                                name="cedula"
                                type="text"
                                [(ngModel)]="cedula"
                                placeholder="V-12345678"
                                autocomplete="username"
                                required
                            />

                            <label for="password">Contraseña</label>
                            <p-password
                                inputId="password"
                                name="password"
                                [(ngModel)]="password"
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

                        <div class="auth-demo">
                            <span class="auth-demo-title">Acceso de prueba</span>
                            <div><strong>V-00000000</strong> / <strong>admin123</strong></div>
                            <button type="button" class="auth-link" (click)="loginDemo()">Usar credenciales de administrador</button>
                        </div>

                        <p class="auth-switch">¿No tienes cuenta? <a routerLink="/auth/registro">Crear una cuenta</a></p>
                    </div>
                </section>
            </div>
        </div>

        <p-dialog [(visible)]="forgotDialog" header="Recuperar contraseña" [modal]="true" [style]="{ width: '420px' }">
            <div class="auth-form" style="gap: 0.75rem;">
                <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 0.5rem;">
                    Ingresa tu cédula y la nueva contraseña para restablecer el acceso a tu cuenta.
                </p>

                <div>
                    <label for="forgotCedula">Cédula *</label>
                    <input
                        pInputText
                        id="forgotCedula"
                        [(ngModel)]="forgotCedula"
                        placeholder="V-12345678"
                        style="width: 100%"
                    />
                </div>

                <div>
                    <label for="forgotNewPassword">Nueva contraseña *</label>
                    <p-password
                        inputId="forgotNewPassword"
                        [(ngModel)]="forgotNewPassword"
                        [toggleMask]="true"
                        [feedback]="false"
                        [fluid]="true"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <div>
                    <label for="forgotConfirmPassword">Confirmar contraseña *</label>
                    <p-password
                        inputId="forgotConfirmPassword"
                        [(ngModel)]="forgotConfirmPassword"
                        [toggleMask]="true"
                        [feedback]="false"
                        [fluid]="true"
                        placeholder="Repite la nueva contraseña"
                    />
                </div>

                @if (forgotError) {
                    <div class="auth-error">
                        <i class="pi pi-exclamation-circle"></i>
                        <span>{{ forgotError }}</span>
                    </div>
                }
            </div>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="forgotDialog = false" />
                <p-button label="Restablecer contraseña" icon="pi pi-check" [loading]="forgotLoading" (click)="submitForgotPassword()" />
            </ng-template>
        </p-dialog>
    `
})
export class Login {
    private readonly auth = inject(AuthService);

    private readonly router = inject(Router);

    private readonly messageService = inject(MessageService);

    cedula = '';

    password = '';

    error = '';

    loading = false;

    forgotDialog = false;

    forgotCedula = '';

    forgotNewPassword = '';

    forgotConfirmPassword = '';

    forgotError = '';

    forgotLoading = false;

    constructor() {
        if (this.auth.currentUser()) {
            this.router.navigate(['/']);
        }
    }

    submit(): void {
        this.error = '';

        if (!this.cedula.trim() || !this.password) {
            this.error = 'Escribe tu cédula y contraseña.';
            return;
        }

        this.loading = true;
        const result = this.auth.login(this.cedula, this.password);

        if (!result.ok) {
            this.error = result.message;
            this.loading = false;
            return;
        }

        this.router.navigate(['/']);
    }

    loginDemo(): void {
        this.cedula = 'V-00000000';
        this.password = 'admin123';
        this.submit();
    }

    openForgotDialog(): void {
        this.forgotCedula = this.cedula || '';
        this.forgotNewPassword = '';
        this.forgotConfirmPassword = '';
        this.forgotError = '';
        this.forgotLoading = false;
        this.forgotDialog = true;
    }

    submitForgotPassword(): void {
        this.forgotError = '';

        const cedulaErr = validateCedula(this.forgotCedula);
        if (cedulaErr) {
            this.forgotError = cedulaErr;
            return;
        }

        const passErr = validatePassword(this.forgotNewPassword);
        if (passErr) {
            this.forgotError = passErr;
            return;
        }

        const confirmErr = validatePasswordConfirmation(this.forgotNewPassword, this.forgotConfirmPassword);
        if (confirmErr) {
            this.forgotError = confirmErr;
            return;
        }

        this.forgotLoading = true;
        const result = this.auth.resetPassword(this.forgotCedula, this.forgotNewPassword);

        if (!result.ok) {
            this.forgotError = result.message;
            this.forgotLoading = false;
            return;
        }

        this.cedula = this.forgotCedula;
        this.password = '';
        this.forgotDialog = false;
        this.forgotLoading = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Contraseña restablecida',
            detail: 'Tu contraseña se actualizó correctamente. Inicia sesión con tu nueva contraseña.',
            life: 4000
        });
    }
}
