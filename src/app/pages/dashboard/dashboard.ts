import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '@/app/services/auth.service';
import { LogService } from '@/app/services/log.service';
import { TagSeverity } from '@/app/services/models';
import { PersonService } from '@/app/services/person.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TableModule, TagModule],
    templateUrl: './dashboard.html'
})
export class Dashboard {
    readonly auth = inject(AuthService);

    private readonly personService = inject(PersonService);

    private readonly logService = inject(LogService);

    readonly stats = this.personService.stats;

    readonly typeSummary = this.personService.typeSummary;

    readonly recentLogs = this.logService.recentLogs;

    readonly recentPersons = computed(() => this.personService.persons().slice(0, 5));

    initials(firstName: string, lastName: string): string {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    typePercent(count: number): number {
        const max = Math.max(...this.typeSummary().map((item) => item.count), 1);
        return Math.round((count / max) * 100);
    }

    getTypeSeverity(type: string): TagSeverity {
        switch (type) {
            case 'Analista':
                return 'info';
            case 'Asistente administrativo':
                return 'success';
            case 'Supervisor':
                return 'warn';
            case 'Director':
                return 'contrast';
            case 'Abogado':
                return 'info';
            case 'Trabajador obrero':
                return 'secondary';
            case 'Pasante':
                return 'success';
            default:
                return 'secondary';
        }
    }

    getStatusSeverity(status: string): TagSeverity {
        switch (status) {
            case 'Activo':
                return 'success';
            case 'Pendiente':
                return 'warn';
            case 'Inactivo':
                return 'danger';
            default:
                return 'info';
        }
    }

    activityIcon(action: string): string {
        if (action.includes('Trabajador') || action.includes('Persona')) {
            return 'pi pi-user-edit';
        }
        if (action.includes('Usuario')) {
            return 'pi pi-user-plus';
        }
        if (action.includes('sesión')) {
            return 'pi pi-sign-in';
        }
        if (action.includes('iniciado') || action.includes('ejemplo')) {
            return 'pi pi-database';
        }
        return 'pi pi-bolt';
    }

    activityTone(action: string): string {
        if (action.includes('elimin')) {
            return 'tone-red';
        }
        if (action.includes('desactiv') || action.includes('Pendiente')) {
            return 'tone-orange';
        }
        if (action.includes('Trabajador') || action.includes('Persona') || action.includes('activ')) {
            return 'tone-green';
        }
        if (action.includes('sesión') || action.includes('Usuario')) {
            return 'tone-blue';
        }
        return 'tone-slate';
    }
}
