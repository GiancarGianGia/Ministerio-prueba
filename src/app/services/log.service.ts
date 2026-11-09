import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivityLog, createEntityId, STORAGE_KEYS } from './models';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class LogService {
    private readonly storage = inject(StorageService);

    private readonly _logs = signal<ActivityLog[]>(this.storage.read<ActivityLog[]>(STORAGE_KEYS.logs, []));

    readonly logs = this._logs.asReadonly();

    readonly recentLogs = computed(() => this._logs().slice(0, 8));

    readonly todayCount = computed(() => {
        const today = new Date().toDateString();
        return this._logs().filter((log) => new Date(log.timestamp).toDateString() === today).length;
    });

    constructor() {
        if (this._logs().length === 0) {
            this.record('Sistema iniciado', 'Se inició el sistema de registro de trabajadores del Ministerio del Poder Popular para el Proceso Social de Trabajo.', 'Sistema');
        }
    }

    record(action: string, description: string, actor: string, entityId?: string): void {
        const entry: ActivityLog = {
            id: createEntityId('LOG'),
            timestamp: new Date().toISOString(),
            action,
            description,
            actor: actor || 'Sistema',
            entityId
        };

        const next = [entry, ...this._logs()].slice(0, 500);
        this._logs.set(next);
        this.storage.write(STORAGE_KEYS.logs, next);
    }

    clear(): void {
        this._logs.set([]);
        this.storage.write(STORAGE_KEYS.logs, []);
    }
}
