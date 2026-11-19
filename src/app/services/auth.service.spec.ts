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
        const result = service.register('Pedro López', 'V-18745678', 'Clave123@');
        expect(result.ok).toBeTrue();
        expect(service.currentUser()?.cedula).toBe('V-18745678');
        expect(service.currentUser()?.role).toBe('Administrador');
    });

    it('register() debe fallar si la cédula ya está registrada', () => {
        service.register('Alicia Ruiz', 'V-18745678', 'Clave123@');
        const result = service.register('Alicia Copia', 'V-18745678', 'Clave456@');
        expect(result.ok).toBeFalse();
    });

    it('register() debe fallar si la cédula no lleva el tipo de documento', () => {
        const result = service.register('Bruno Díaz', '18745678', 'Clave123@');
        expect(result.ok).toBeFalse();
        expect(result.message).toContain('tipo de documento');
    });

    it('register() debe fallar si la contraseña no cumple las reglas', () => {
        const result = service.register('Carlos M.', 'V-18745678', '123');
        expect(result.ok).toBeFalse();
    });

    it('register() debe exigir minúscula, mayúscula, número, más de 8 caracteres y carácter especial', () => {
        expect(service.register('Diana R.', 'V-18745679', 'CLAVE123@').ok).toBeFalse();
        expect(service.register('Diana R.', 'V-18745679', 'Clave123').ok).toBeFalse();
        expect(service.register('Diana R.', 'V-18745679', 'Clave123@').ok).toBeTrue();
    });

    it('register() debe guardar las preguntas de seguridad con la respuesta en mayúsculas', () => {
        const result = service.register('Elena Paz', 'V-18745680', 'Clave123@', [
            { question: '¿En qué ciudad naciste?', answer: '  caracas ' }
        ]);

        expect(result.ok).toBeTrue();
        expect(service.currentUser()?.securityQuestions).toEqual([
            { question: '¿En qué ciudad naciste?', answer: 'CARACAS' }
        ]);
    });

    it('register() con preguntas permite recuperar la contraseña con las respuestas correctas', () => {
        service.register('Elena Paz', 'V-18745681', 'Clave123@', [
            { question: '¿En qué ciudad naciste?', answer: 'caracas' }
        ]);
        service.logout();

        expect(service.resetPassword('V-18745681', 'Nueva123@').ok).toBeFalse();

        const result = service.resetPassword('V-18745681', 'Nueva123@', [
            { question: '¿En qué ciudad naciste?', answer: 'CARACAS' }
        ]);
        expect(result.ok).toBeTrue();
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
                    password: 'Clave123@',
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

    it('resetPassword() debe actualizar la contraseña de un usuario existente', () => {
        const res = service.resetPassword('V-00000000', 'NuevaClave1@');
        expect(res.ok).toBeTrue();
        const loginRes = service.login('V-00000000', 'NuevaClave1@');
        expect(loginRes.ok).toBeTrue();
    });

    it('resetPassword() debe fallar si la cédula no existe', () => {
        const res = service.resetPassword('V-99999999', 'NuevaClave1@');
        expect(res.ok).toBeFalse();
    });

    it('resetPassword() debe fallar con una contraseña inválida', () => {
        const res = service.resetPassword('V-00000000', '123');
        expect(res.ok).toBeFalse();
    });

    it('exige un motivo para deshabilitar y muestra quién y por qué al iniciar sesión', () => {
        service.login('V-00000000', 'admin123');
        const created = service.createUser({
            fullName: 'Gian Pérez',
            cedula: 'V-12345678',
            password: 'Clave123@',
            role: 'Administrador',
            active: true,
            securityQuestions: [{ question: '¿En qué ciudad naciste?', answer: 'Caracas' }]
        });
        expect(created.ok).toBeTrue();

        const gian = service.users().find((user) => user.cedula === 'V-12345678');
        expect(gian).toBeDefined();

        const withoutReason = service.toggleUser(gian!.id);
        expect(withoutReason.ok).toBeFalse();
        expect(withoutReason.message).toBe('Escribe el motivo de la deshabilitación.');

        const deactivated = service.toggleUser(gian!.id, 'Incumplimiento de las normas internas.');
        expect(deactivated.ok).toBeTrue();
        expect(service.users().find((user) => user.id === gian!.id)?.deactivationReason).toBe('Incumplimiento de las normas internas.');

        const expectedMessage = 'Esta cuenta fue deshabilitada por Administrador del Sistema. Motivo: Incumplimiento de las normas internas. Contacta a un administrador.';
        expect(service.login('V-12345678', 'Clave123@').message).toBe(expectedMessage);
        expect(service.getSecurityQuestions('V-12345678').message).toBe(expectedMessage);
        expect(service.verifySecurityQuestions('V-12345678', [{ question: '¿En qué ciudad naciste?', answer: 'Caracas' }]).message).toBe(expectedMessage);
        expect(service.resetPassword('V-12345678', 'NuevaClave1@').message).toBe(expectedMessage);

        expect(service.toggleUser(gian!.id).ok).toBeTrue();
        const reactivated = service.users().find((user) => user.id === gian!.id);
        expect(reactivated?.deactivationReason).toBeUndefined();
        expect(reactivated?.deactivatedBy).toBeUndefined();
    });

    it('exige un motivo para eliminar y avisa quién y por qué al intentar iniciar sesión', () => {
        service.login('V-00000000', 'admin123');
        const created = service.createUser({
            fullName: 'Gian Pérez',
            cedula: 'V-12345678',
            password: 'Clave123@',
            role: 'Administrador',
            active: true
        });
        expect(created.ok).toBeTrue();

        const gian = service.users().find((user) => user.cedula === 'V-12345678');
        expect(gian).toBeDefined();

        const withoutReason = service.deleteUser(gian!.id);
        expect(withoutReason.ok).toBeFalse();
        expect(withoutReason.message).toBe('Escribe el motivo de la eliminación.');

        const deleted = service.deleteUser(gian!.id, 'Fraude comprobado.');
        expect(deleted.ok).toBeTrue();
        expect(service.users().some((user) => user.id === gian!.id)).toBeFalse();

        const expectedMessage = 'Esta cuenta fue eliminada por Administrador del Sistema. Motivo: Fraude comprobado. Si deseas volver a ingresar, un administrador debe crear tu cuenta nuevamente.';
        expect(service.login('V-12345678', 'Clave123@').message).toBe(expectedMessage);
        expect(service.getSecurityQuestions('V-12345678').message).toBe(expectedMessage);

        const recreated = service.createUser({
            fullName: 'Gian Pérez',
            cedula: 'V-12345678',
            password: 'Clave123@',
            role: 'Administrador',
            active: true
        });
        expect(recreated.ok).toBeTrue();
        expect(service.login('V-12345678', 'Clave123@').ok).toBeTrue();
    });

    describe('restricciones de gestión de cuentas', () => {
        const baseInput = (cedula: string) => ({
            fullName: 'Usuario Prueba',
            cedula,
            password: 'Clave123@',
            role: 'Administrador' as const,
            active: true
        });

        const createOther = (): string => {
            const created = service.createUser(baseInput('V-12345678'));
            expect(created.ok).toBeTrue();
            return service.users().find((user) => user.cedula === 'V-12345678')!.id;
        };

        it('updateUser() debe rechazar modificar la cédula de un usuario', () => {
            service.login('V-00000000', 'admin123');
            const otherId = createOther();

            const result = service.updateUser(otherId, { ...baseInput('V-87654321'), password: undefined });

            expect(result.ok).toBeFalse();
            expect(result.message).toContain('cédula');
            expect(service.users().find((user) => user.id === otherId)?.cedula).toBe('V-12345678');
        });

        it('updateUser() debe rechazar cambiar la contraseña de otro usuario', () => {
            service.login('V-00000000', 'admin123');
            const otherId = createOther();

            const result = service.updateUser(otherId, { ...baseInput('V-12345678'), password: 'OtraClave9@' });

            expect(result.ok).toBeFalse();
            expect(result.message).toContain('propio');
        });

        it('updateUser() debe rechazar cambiar las preguntas de seguridad de otro usuario', () => {
            service.login('V-00000000', 'admin123');
            const otherId = createOther();

            const result = service.updateUser(otherId, {
                ...baseInput('V-12345678'),
                password: undefined,
                securityQuestions: [{ question: '¿En qué ciudad naciste?', answer: 'Caracas' }]
            });

            expect(result.ok).toBeFalse();
            expect(result.message).toContain('preguntas de seguridad');
        });

        it('updateUser() debe rechazar que un administrador se deshabilite a sí mismo', () => {
            service.login('V-00000000', 'admin123');
            createOther();
            const selfId = service.currentUser()!.id;

            const result = service.updateUser(selfId, {
                fullName: 'Administrador del Sistema',
                cedula: 'V-00000000',
                role: 'Administrador',
                active: false,
                deactivationReason: 'Prueba'
            });

            expect(result.ok).toBeFalse();
            expect(result.message).toBe('No puedes deshabilitar tu propia cuenta.');
            expect(service.currentUser()?.active).toBeTrue();
        });

        it('updateUser() debe permitir cambiar la propia contraseña y preguntas de seguridad', () => {
            service.login('V-00000000', 'admin123');
            const selfId = service.currentUser()!.id;

            const result = service.updateUser(selfId, {
                fullName: 'Administrador del Sistema',
                cedula: 'V-00000000',
                role: 'Administrador',
                active: true,
                password: 'NuevaClave9@',
                securityQuestions: [{ question: '¿En qué ciudad naciste?', answer: 'Caracas' }]
            });

            expect(result.ok).toBeTrue();
            expect(service.login('V-00000000', 'nuevaclave9@').ok).toBeTrue();
        });
    });
});
