import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
    read<T>(key: string, fallback: T): T {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : fallback;
        } catch {
            return fallback;
        }
    }

    write(key: string, value: unknown): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {}
    }

    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch {}
    }
}
