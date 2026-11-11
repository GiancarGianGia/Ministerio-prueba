import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule, RouterModule, ButtonModule, InputTextModule, PasswordModule],
    template: `
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
                        <h1>Registra y organiza a los trabajadores del ministerio en un solo lugar.</h1>
                        <p>Un espacio seguro para administrar el registro de trabajadores, los usuarios del sistema y la trazabilidad de cada movimiento.</p>

                        <ul class="auth-benefits">
                            <li><i class="pi pi-check-circle"></i><span>Registro completo de trabajadores y sus datos de contacto.</span></li>
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
    `
})
export class Login {
    private readonly auth = inject(AuthService);

    private readonly router = inject(Router);

    cedula = '';

    password = '';

    error = '';

    loading = false;

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
}
