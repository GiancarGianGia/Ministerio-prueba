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
                            <p>Ingresa con tu cuenta para administrar y actualizar la información de los trabajadores.</p>
                        </div>

                        <form class="auth-form" (ngSubmit)="submit()">
                            <label for="cedula">Cédula</label>
                            <input
                                pInputText
                                id="cedula"
                                name="cedula"
                                type="text"
                                [(ngModel)]="cedula"
                                (ngModelChange)="cedulaTouched = true"
                                placeholder="V-12345678"
                                autocomplete="username"
                                required
                            />
                            @if (cedulaTouched && cedulaError()) {
                                <small class="field-error">{{ cedulaError() }}</small>
                            }

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

        <!-- DIÁLOGO RECUPERAR CONTRASEÑA (3 pasos) -->
        <p-dialog [(visible)]="forgotDialog" [header]="forgotDialogHeader" [modal]="true" [style]="{ width: '440px', maxWidth: '95vw' }" (onHide)="resetForgotState()">
            <div class="auth-form" style="gap: 0.75rem;">

                <!-- PASO 1: Ingresar cédula -->
                @if (forgotStep === 1) {
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 0.5rem;">
                        Ingresa tu cédula para verificar tu identidad.
                    </p>
                    <div>
                        <label for="forgotCedula">Cédula *</label>
                        <input
                            pInputText
                            id="forgotCedula"
                            [(ngModel)]="forgotCedula"
                            (ngModelChange)="forgotCedulaTouched = true"
                            placeholder="V-12345678"
                            style="width: 100%"
                        />
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
                        <div style="margin-bottom: 0.75rem;">
                            <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 0.3rem;">{{ q }}</label>
                            <input
                                pInputText
                                [(ngModel)]="forgotAnswers[$index]"
                                placeholder="Tu respuesta..."
                                style="width: 100%"
                            />
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
    cedulaTouched = false;
    password = '';
    error = '';
    loading = false;

    forgotDialog = false;
    forgotStep = 1;
    forgotCedula = '';
    forgotCedulaTouched = false;
    forgotQuestions: string[] = [];
    forgotAnswers: string[] = [];
    forgotNewPassword = '';
    forgotConfirmPassword = '';
    forgotError = '';
    forgotLoading = false;

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
        return validateCedula(this.cedula) ?? '';
    }

    forgotCedulaError(): string {
        return validateCedula(this.forgotCedula) ?? '';
    }

    submit(): void {
        this.error = '';
        if (!this.cedula.trim() || !this.password) {
            this.error = 'Escribe tu cédula y contraseña.';
            return;
        }
        const cedulaError = validateCedula(this.cedula);
        if (cedulaError) {
            this.error = cedulaError;
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
        this.resetForgotState();
        this.forgotCedula = this.cedula || '';
        this.forgotDialog = true;
    }

    resetForgotState(): void {
        this.forgotStep = 1;
        this.forgotCedula = '';
        this.forgotCedulaTouched = false;
        this.forgotQuestions = [];
        this.forgotAnswers = [];
        this.forgotNewPassword = '';
        this.forgotConfirmPassword = '';
        this.forgotError = '';
        this.forgotLoading = false;
    }

    forgotStep1(): void {
        this.forgotError = '';
        this.forgotCedulaTouched = true;
        const cedulaErr = validateCedula(this.forgotCedula);
        if (cedulaErr) { this.forgotError = cedulaErr; return; }

        this.forgotLoading = true;
        const result = this.auth.getSecurityQuestions(this.forgotCedula);
        this.forgotLoading = false;

        if (!result.ok) { this.forgotError = result.message; return; }

        if (result.questions.length === 0) {
            this.forgotQuestions = [];
            this.forgotAnswers = [];
            this.forgotStep = 3;
        } else {
            this.forgotQuestions = result.questions;
            this.forgotAnswers = result.questions.map(() => '');
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
        const result = this.auth.verifySecurityQuestions(this.forgotCedula, answeredQuestions);
        this.forgotLoading = false;

        if (!result.ok) {
            this.forgotError = result.message;
            return;
        }

        this.forgotStep = 3;
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
            this.forgotCedula,
            this.forgotNewPassword,
            answeredQuestions.length > 0 ? answeredQuestions : undefined
        );

        this.forgotLoading = false;

        if (!result.ok) {
            this.forgotError = result.message;
            if (this.forgotQuestions.length > 0) {
                this.forgotStep = 2;
                this.forgotAnswers = this.forgotQuestions.map(() => '');
            }
            return;
        }

        this.cedula = this.forgotCedula;
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
