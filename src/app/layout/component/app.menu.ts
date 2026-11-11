import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@/app/services/auth.service';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu {
    private readonly auth = inject(AuthService);

    private readonly router = inject(Router);

    model: MenuItem[] = [];

    ngOnInit() {
        const adminItems: MenuItem[] = this.auth.isAdmin()
            ? [{ label: 'Usuarios', icon: 'pi pi-fw pi-shield', routerLink: ['/usuarios'] }]
            : [];

        this.model = [
            {
                label: 'Principal',
                items: [{ label: 'Panel principal', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Trabajadores',
                items: [
                    { label: 'Trabajadores registrados', icon: 'pi pi-fw pi-users', routerLink: ['/personas'] }
                ]
            },
            {
                label: 'Administración',
                items: [...adminItems, { label: 'Registro de actividad', icon: 'pi pi-fw pi-history', routerLink: ['/actividad'] }]
            },
            {
                label: 'Cerrar sesión',
                icon: 'pi pi-fw pi-sign-out',
                class: 'session-logout-menuitem',
                command: () => this.logout()
            }
        ];
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
