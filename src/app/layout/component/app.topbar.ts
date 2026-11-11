import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, ButtonModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()" title="Abrir menú">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <span class="topbar-logo-icon"><i class="pi pi-id-card"></i></span>
                <span class="topbar-logo-text">
                    <strong>MPPPST</strong>
                    <small>Proceso Social de Trabajo</small>
                </span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            @if (auth.currentUser(); as user) {
                <div class="topbar-user">
                    <span class="person-avatar">{{ initials(user.fullName) }}</span>
                    <div class="topbar-user-info">
                        <strong>{{ user.fullName }}</strong>
                        <small>{{ user.role }}</small>
                    </div>
                </div>
            }

            <button type="button" class="layout-topbar-action" title="Cerrar sesión" aria-label="Cerrar sesión" (click)="logout()">
                <i class="pi pi-sign-out"></i>
            </button>
        </div>
    </div>`
})
export class AppTopbar {
    readonly layoutService = inject(LayoutService);

    readonly auth = inject(AuthService);

    private readonly router = inject(Router);

    initials(fullName: string): string {
        return fullName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase();
    }

    logout(): void {
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
