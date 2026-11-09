import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
    let service: StorageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(StorageService);
        localStorage.clear();
    });

    afterEach(() => localStorage.clear());

    it('debería crearse correctamente', () => {
        expect(service).toBeTruthy();
    });

    it('write() y read() deben guardar y recuperar un valor', () => {
        service.write('test-key', { nombre: 'María' });
        const result = service.read<{ nombre: string }>('test-key', { nombre: '' });
        expect(result.nombre).toBe('María');
    });

    it('read() debe retornar el fallback si la clave no existe', () => {
        const result = service.read<number>('clave-inexistente', 42);
        expect(result).toBe(42);
    });

    it('remove() debe eliminar la clave del storage', () => {
        service.write('test-key', 'valor');
        service.remove('test-key');
        const result = service.read<string>('test-key', 'fallback');
        expect(result).toBe('fallback');
    });

    it('read() debe retornar el fallback si el JSON está corrupto', () => {
        localStorage.setItem('key-corrupta', '{esto no es json válido');
        const result = service.read<string>('key-corrupta', 'seguro');
        expect(result).toBe('seguro');
    });
});
