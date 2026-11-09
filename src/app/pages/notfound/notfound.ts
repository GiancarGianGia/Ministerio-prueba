import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [RouterModule, ButtonModule],
    template: `
        <div class="notfound-page">
            <div class="notfound-card">
                <div class="notfound-icon"><i class="pi pi-compass"></i></div>
                <span class="page-eyebrow">Error 404</span>
                <h1>Página no encontrada</h1>
                <p>La página que buscas no existe o fue movida. Vuelve al panel de registro para continuar.</p>
                <div class="notfound-actions">
                    <p-button label="Ir al panel" icon="pi pi-home" (onClick)="goToHome()" />
                    <p-button label="Iniciar sesión" icon="pi pi-sign-in" severity="secondary" [outlined]="true" (onClick)="goToLogin()" />
                </div>
            </div>
        </div>
    `
})
export class Notfound {
    private readonly auth = inject(AuthService);

    private readonly router = inject(Router);

    goToHome(): void {
        this.router.navigate(['/']);
    }

    goToLogin(): void {
        this.auth.logout();
        this.router.navigate(['/auth/login']).then((ok) => {
            if (!ok) {
                window.location.href = '/auth/login';
            }
        }).catch(() => {
            window.location.href = '/auth/login';
        });
    }
}
