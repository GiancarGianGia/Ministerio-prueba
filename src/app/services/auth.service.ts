import { computed, inject, Injectable, signal } from '@angular/core';
import { AppUser, AuthResult, NewUserInput, nextSequentialId, STORAGE_KEYS, UpdateUserInput, USER_ROLES, UserRole } from './models';
import { LogService } from './log.service';
import { StorageService } from './storage.service';
import { isValidEmail, validateEmail, validatePassword } from './validators';

const DEFAULT_ADMIN: AppUser = {
    id: 'USR-0001',
    fullName: 'Administrador del Sistema',
    email: 'admin@registro.com',
    password: 'admin123',
    role: 'Administrador',
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: 'Sistema'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly storage = inject(StorageService);

    private readonly logService = inject(LogService);

    private readonly _users = signal<AppUser[]>([]);

    private readonly _currentUser = signal<AppUser | null>(null);

    readonly users = this._users.asReadonly();

    readonly currentUser = this._currentUser.asReadonly();

    readonly isAdmin = computed(() => this._currentUser()?.role === 'Administrador');

    readonly activeUsers = computed(() => this._users().filter((user) => user.active));

    readonly adminUsers = computed(() => this._users().filter((user) => user.role === 'Administrador' && user.active));

    constructor() {
        this.bootstrap();
    }

    login(email: string, password: string): AuthResult {
        const normalizedEmail = email.trim().toLowerCase();
        const user = this._users().find((item) => item.email.toLowerCase() === normalizedEmail);

        if (!user || user.password !== password) {
            return { ok: false, message: 'El correo o la contraseña no son correctos.' };
        }

        if (!user.active) {
            return { ok: false, message: 'Este usuario está desactivado. Contacta a un administrador.' };
        }

        const updated: AppUser = { ...user, lastLogin: new Date().toISOString() };
        this._users.update((users) => users.map((item) => (item.id === updated.id ? updated : item)));
        this.persistUsers();
        this._currentUser.set(updated);
        this.storage.write(STORAGE_KEYS.session, updated.id);
        this.logService.record('Inicio de sesión', `${updated.fullName} inició sesión en el sistema.`, updated.fullName, updated.id);

        return { ok: true, message: 'Sesión iniciada correctamente.' };
    }

    register(fullName: string, email: string, password: string): AuthResult {
        const name = fullName.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (name.length < 3) {
            return { ok: false, message: 'Escribe el nombre completo del usuario.' };
        }

        const emailError = validateEmail(normalizedEmail);
        if (emailError) {
            return { ok: false, message: emailError };
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return { ok: false, message: passwordError };
        }

        if (this._users().some((user) => user.email.toLowerCase() === normalizedEmail)) {
            return { ok: false, message: 'Ya existe un usuario registrado con ese correo.' };
        }

        const newUser: AppUser = {
            id: nextSequentialId('USR', this._users().map((user) => user.id)),
            fullName: name,
            email: normalizedEmail,
            password,
            role: 'Registrador',
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: 'Auto-registro',
            lastLogin: new Date().toISOString()
        };

        this._users.update((users) => [...users, newUser]);
        this.persistUsers();
        this._currentUser.set(newUser);
        this.storage.write(STORAGE_KEYS.session, newUser.id);
        this.logService.record(
            'Usuario registrado',
            `${newUser.fullName} creó una cuenta con el rol ${newUser.role} y accedió al sistema.`,
            newUser.fullName,
            newUser.id
        );

        return { ok: true, message: 'Cuenta creada. Ya puedes usar el sistema.' };
    }

    createUser(input: NewUserInput): AuthResult {
        if (!this.isAdmin()) {
            return { ok: false, message: 'Solo un administrador puede crear usuarios.' };
        }

        const name = input.fullName.trim();
        const normalizedEmail = input.email.trim().toLowerCase();

        if (name.length < 3) {
            return { ok: false, message: 'Escribe el nombre completo del usuario.' };
        }

        const emailError = validateEmail(normalizedEmail);
        if (emailError) {
            return { ok: false, message: emailError };
        }

        const passwordError = validatePassword(input.password);
        if (passwordError) {
            return { ok: false, message: passwordError };
        }

        if (this._users().some((user) => user.email.toLowerCase() === normalizedEmail)) {
            return { ok: false, message: 'Ya existe un usuario con ese correo.' };
        }

        const actor = this.currentUser()?.fullName ?? 'Sistema';
        const newUser: AppUser = {
            id: nextSequentialId('USR', this._users().map((user) => user.id)),
            fullName: name,
            email: normalizedEmail,
            password: input.password,
            role: input.role,
            active: input.active,
            createdAt: new Date().toISOString(),
            createdBy: actor
        };

        this._users.update((users) => [...users, newUser]);
        this.persistUsers();
        this.logService.record('Usuario creado', `${actor} creó el usuario ${newUser.fullName} con rol ${newUser.role}.`, actor, newUser.id);

        return { ok: true, message: 'Usuario creado y agregado al sistema.' };
    }

    updateUser(id: string, input: UpdateUserInput): AuthResult {
        if (!this.isAdmin()) {
            return { ok: false, message: 'Solo un administrador puede actualizar usuarios.' };
        }

        const user = this._users().find((item) => item.id === id);
        if (!user) {
            return { ok: false, message: 'El usuario no existe.' };
        }

        const name = input.fullName.trim();
        const normalizedEmail = input.email.trim().toLowerCase();

        if (name.length < 3) {
            return { ok: false, message: 'Escribe el nombre completo del usuario.' };
        }

        const emailError = validateEmail(normalizedEmail);
        if (emailError) {
            return { ok: false, message: emailError };
        }

        if (this._users().some((item) => item.id !== id && item.email.toLowerCase() === normalizedEmail)) {
            return { ok: false, message: 'Ya existe otro usuario con ese correo.' };
        }

        if (input.password) {
            const passwordError = validatePassword(input.password);
            if (passwordError) {
                return { ok: false, message: passwordError };
            }
        }

        if (user.role === 'Administrador' && (input.role !== 'Administrador' || !input.active) && this.isLastActiveAdmin(user.id)) {
            return { ok: false, message: 'No puedes quitar el acceso al último administrador activo.' };
        }

        const updated: AppUser = {
            ...user,
            fullName: name,
            email: normalizedEmail,
            role: input.role,
            active: input.active,
            password: input.password?.trim() ? input.password : user.password
        };

        this._users.update((users) => users.map((item) => (item.id === id ? updated : item)));
        this.persistUsers();

        if (this._currentUser()?.id === id) {
            this._currentUser.set(updated);
        }

        const actor = this.currentUser()?.fullName ?? 'Sistema';
        this.logService.record('Usuario actualizado', `${actor} actualizó los datos del usuario ${updated.fullName}.`, actor, updated.id);

        return { ok: true, message: 'Usuario actualizado correctamente.' };
    }

    toggleUser(id: string): AuthResult {
        if (!this.isAdmin()) {
            return { ok: false, message: 'Solo un administrador puede cambiar el estado de los usuarios.' };
        }

        if (this._currentUser()?.id === id) {
            return { ok: false, message: 'No puedes desactivar tu propia cuenta.' };
        }

        const user = this._users().find((item) => item.id === id);
        if (!user) {
            return { ok: false, message: 'El usuario no existe.' };
        }

        if (user.active && user.role === 'Administrador' && this.isLastActiveAdmin(user.id)) {
            return { ok: false, message: 'No puedes desactivar al último administrador activo.' };
        }

        const updated: AppUser = { ...user, active: !user.active };
        this._users.update((users) => users.map((item) => (item.id === id ? updated : item)));
        this.persistUsers();

        const actor = this.currentUser()?.fullName ?? 'Sistema';
        this.logService.record(
            updated.active ? 'Usuario activado' : 'Usuario desactivado',
            `${actor} ${updated.active ? 'activó' : 'desactivó'} al usuario ${updated.fullName}.`,
            actor,
            updated.id
        );

        return { ok: true, message: `Usuario ${updated.active ? 'activado' : 'desactivado'} correctamente.` };
    }

    deleteUser(id: string): AuthResult {
        if (!this.isAdmin()) {
            return { ok: false, message: 'Solo un administrador puede eliminar usuarios.' };
        }

        if (this._currentUser()?.id === id) {
            return { ok: false, message: 'No puedes eliminar tu propia cuenta.' };
        }

        const user = this._users().find((item) => item.id === id);
        if (!user) {
            return { ok: false, message: 'El usuario no existe.' };
        }

        if (user.role === 'Administrador' && this.isLastActiveAdmin(user.id)) {
            return { ok: false, message: 'No puedes eliminar al último administrador activo.' };
        }

        this._users.update((users) => users.filter((item) => item.id !== id));
        this.persistUsers();

        const actor = this.currentUser()?.fullName ?? 'Sistema';
        this.logService.record('Usuario eliminado', `${actor} eliminó al usuario ${user.fullName}.`, actor, user.id);

        return { ok: true, message: 'Usuario eliminado correctamente.' };
    }

    logout(): void {
        const user = this._currentUser();
        if (user) {
            this.logService.record('Cierre de sesión', `${user.fullName} cerró sesión.`, user.fullName, user.id);
        }

        this._currentUser.set(null);
        this.storage.remove(STORAGE_KEYS.session);
    }

    readonly roleOptions: { label: string; value: UserRole }[] = USER_ROLES.map((role) => ({ label: role, value: role }));

    private bootstrap(): void {
        const users = this.storage.read<AppUser[]>(STORAGE_KEYS.users, []);
        const normalizedUsers = users.length ? users : [DEFAULT_ADMIN];

        this._users.set(normalizedUsers);
        this.persistUsers();

        const sessionId = this.storage.read<string | null>(STORAGE_KEYS.session, null);
        const sessionUser = sessionId ? normalizedUsers.find((user) => user.id === sessionId && user.active) : null;

        if (sessionUser) {
            this._currentUser.set(sessionUser);
        } else {
            this.storage.remove(STORAGE_KEYS.session);
        }
    }

    private persistUsers(): void {
        this.storage.write(STORAGE_KEYS.users, this._users());
    }

    private isLastActiveAdmin(id: string): boolean {
        return this._users().filter((user) => user.role === 'Administrador' && user.active && user.id !== id).length === 0;
    }

    private isValidEmail(email: string): boolean {
        return isValidEmail(email);
    }
}
