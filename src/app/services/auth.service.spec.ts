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
        const result = service.login('noexiste@test.com', 'malaclave');
        expect(result.ok).toBeFalse();
    });

    it('login() debe tener éxito con las credenciales del admin por defecto', () => {
        const result = service.login('admin@registro.com', 'admin123');
        expect(result.ok).toBeTrue();
        expect(service.currentUser()).not.toBeNull();
    });

    it('logout() debe limpiar la sesión actual', () => {
        service.login('admin@registro.com', 'admin123');
        service.logout();
        expect(service.currentUser()).toBeNull();
    });

    it('isAdmin() debe ser true después de iniciar sesión como admin', () => {
        service.login('admin@registro.com', 'admin123');
        expect(service.isAdmin()).toBeTrue();
    });

    it('register() debe crear un nuevo usuario y dejarlo con sesión iniciada', () => {
        const result = service.register('Pedro López', 'pedro@test.com', 'clave123');
        expect(result.ok).toBeTrue();
        expect(service.currentUser()?.email).toBe('pedro@test.com');
    });

    it('register() debe fallar si el correo ya está registrado', () => {
        service.register('Alicia Ruiz', 'alicia@test.com', 'clave123');
        const result = service.register('Alicia Copia', 'alicia@test.com', 'clave456');
        expect(result.ok).toBeFalse();
    });

    it('register() debe fallar si la contraseña tiene menos de 6 caracteres', () => {
        const result = service.register('Carlos M.', 'carlos@test.com', '123');
        expect(result.ok).toBeFalse();
    });

    it('roleOptions debe ser una propiedad con los 3 roles disponibles', () => {
        expect(service.roleOptions.length).toBe(3);
        expect(service.roleOptions.map(r => r.value)).toContain('Administrador');
    });
});
