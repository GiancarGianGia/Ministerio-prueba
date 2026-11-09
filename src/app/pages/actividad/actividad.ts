import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/services/auth.service';
import { LogService } from '@/app/services/log.service';
import { TagSeverity } from '@/app/services/models';

@Component({
    selector: 'app-actividad',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ConfirmDialogModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        SelectModule,
        TableModule,
        TagModule,
        ToastModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './actividad.html'
})
export class Actividad {
    readonly auth = inject(AuthService);

    readonly logService = inject(LogService);

    private readonly messageService = inject(MessageService);

    private readonly confirmationService = inject(ConfirmationService);

    readonly logs = this.logService.logs;

    selectedAction = signal<string | null>(null);

    readonly actionOptions = computed(() => {
        const unique = Array.from(new Set(this.logs().map((log) => log.action))).sort();
        return unique.map((action) => ({ label: action, value: action }));
    });

    readonly filteredLogs = computed(() => {
        const action = this.selectedAction();
        return action ? this.logs().filter((log) => log.action === action) : this.logs();
    });

    onGlobalFilter(table: any, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    clearLogs(): void {
        this.confirmationService.confirm({
            message: '¿Deseas limpiar todo el historial de actividad? Esta acción no se puede deshacer.',
            header: 'Limpiar historial',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Limpiar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const actor = this.auth.currentUser()?.fullName ?? 'Sistema';
                this.logService.clear();
                this.logService.record('Registro limpiado', `${actor} limpió el historial de actividad del sistema.`, actor);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Historial limpiado',
                    detail: 'El registro de actividad se reinició correctamente.',
                    life: 3000
                });
            }
        });
    }

    initials(name: string): string {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase();
    }

    getActionSeverity(action: string): TagSeverity {
        if (action.includes('elimin') || action.includes('limpiado')) {
            return 'danger';
        }
        if (action.includes('cread') || action.includes('registrad') || action.includes('activad') || action.includes('ejemplo')) {
            return 'success';
        }
        if (action.includes('desactiv')) {
            return 'warn';
        }
        if (action.includes('sesión') || action.includes('actualiz')) {
            return 'info';
        }
        return 'secondary';
    }
}
