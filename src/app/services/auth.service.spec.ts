import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(AuthService);
    });

    afterEach(() => localStorage.clear());

    it('debería crearse con el usuario admin por defecto', () => {
        expect(service).toBeTruthy();
        expect(service.users().length).toBeGreaterThan(0);
    });

    it('login() debe fallar con credenciales incorrectas', () => {
        const result = service.login('V-12345678', 'malaclave');
        expect(result.ok).toBeFalse();
    });

    it('login() debe tener éxito con las credenciales del admin por defecto', () => {
        const result = service.login('V-00000000', 'admin123');
        expect(result.ok).toBeTrue();
        expect(service.currentUser()).not.toBeNull();
    });

    it('logout() debe limpiar la sesión actual', () => {
        service.login('V-00000000', 'admin123');
        service.logout();
        expect(service.currentUser()).toBeNull();
    });

    it('isAdmin() debe ser true después de iniciar sesión como admin', () => {
        service.login('V-00000000', 'admin123');
        expect(service.isAdmin()).toBeTrue();
    });

    it('register() debe crear un nuevo usuario y dejarlo con sesión iniciada', () => {
        const result = service.register('Pedro López', '18745678', 'clave123');
        expect(result.ok).toBeTrue();
        expect(service.currentUser()?.cedula).toBe('V-18745678');
        expect(service.currentUser()?.role).toBe('Administrador');
    });

    it('register() debe fallar si la cédula ya está registrada', () => {
        service.register('Alicia Ruiz', '18745678', 'clave123');
        const result = service.register('Alicia Copia', 'V-18745678', 'clave456');
        expect(result.ok).toBeFalse();
    });

    it('register() debe fallar si la contraseña tiene menos de 6 caracteres', () => {
        const result = service.register('Carlos M.', '18745678', '123');
        expect(result.ok).toBeFalse();
    });

    it('migrates stored accounts while keeping only supported account fields', () => {
        localStorage.setItem(
            'registro.usuarios.v1',
            JSON.stringify([
                {
                    id: 'USR-0001',
                    fullName: 'Administrador del Sistema',
                    legacyField: 'old value',
                    password: 'admin123',
                    role: 'Administrador',
                    active: true,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    createdBy: 'Sistema'
                },
                {
                    id: 'USR-0002',
                    fullName: 'Usuario anterior',
                    legacyField: 'another old value',
                    password: 'clave123',
                    role: 'Registrador',
                    active: true,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    createdBy: 'Sistema'
                }
            ])
        );
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({});

        const migratedService = TestBed.inject(AuthService);
        const savedUsers = JSON.parse(localStorage.getItem('registro.usuarios.v1') ?? '[]');

        expect(migratedService.users()[0].cedula).toBe('V-00000000');
        expect(migratedService.users()[1].cedula).toBe('');
        expect(savedUsers[0].legacyField).toBeUndefined();
        expect(savedUsers[1].legacyField).toBeUndefined();
    });

    it('roleOptions debe incluir el rol Administrador', () => {
        expect(service.roleOptions.length).toBe(1);
        expect(service.roleOptions.map(r => r.value)).toContain('Administrador');
    });
});
