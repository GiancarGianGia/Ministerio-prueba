import { computed, inject, Injectable, signal } from '@angular/core';
import { AppUser, AuthResult, DeletedUserRecord, NewUserInput, nextSequentialId, STORAGE_KEYS, UpdateUserInput, UserRole } from './models';
import { LogService } from './log.service';
import { StorageService } from './storage.service';
import { normalizeCedula, validateCedula, validatePassword } from './validators';

const DEFAULT_ADMIN: AppUser = {
    id: 'USR-0001',
    fullName: 'Administrador del Sistema',
    cedula: 'V-00000000',
    password: 'ADMIN123',
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

    private readonly _deletedUsers = signal<DeletedUserRecord[]>([]);

    readonly users = this._users.asReadonly();

    readonly currentUser = this._currentUser.asReadonly();

    readonly isAdmin = computed(() => this._currentUser()?.role === 'Administrador');

    readonly activeUsers = computed(() => this._users().filter((user) => user.active));

    readonly adminUsers = computed(() => this._users().filter((user) => user.role === 'Administrador' && user.active));

    constructor() {
        this.bootstrap();
    }

    login(cedula: string, password: string): AuthResult {
        const normalizedCedula = normalizeCedula(cedula);
        const user = this._users().find((item) => item.cedula === normalizedCedula);

        if (!user) {
            const deleted = this.deletedUserRecord(normalizedCedula);
            return {
                ok: false,
                message: deleted ? this.deletedUserMessage(deleted) : 'La cédula o la contraseña no son correctas.'
            };
        }

        if (user.password.toUpperCase() !== password.toUpperCase()) {
            return { ok: false, message: 'La cédula o la contraseña no son correctas.' };
        }

        if (!user.active) {
            return { ok: false, message: this.deactivatedUserMessage(user) };
        }

        const updated: AppUser = { ...user, lastLogin: new Date().toISOString() };
        this._users.update((users) => users.map((item) => (item.id === updated.id ? updated : item)));
        this.persistUsers();
        this._currentUser.set(updated);
        this.storage.write(STORAGE_KEYS.session, updated.id);
        this.logService.record('Inicio de sesión', `${updated.fullName} inició sesión en el sistema.`, updated.fullName, updated.id);

        return { ok: true, message: 'Sesión iniciada correctamente.' };
    }

    register(fullName: string, cedula: string, password: string): AuthResult {
        const name = fullName.trim();
        const normalizedCedula = normalizeCedula(cedula);

        if (name.length < 3) {
            return { ok: false, message: 'Escribe el nombre completo del usuario.' };
        }

        const cedulaError = validateCedula(cedula);
        if (cedulaError) {
            return { ok: false, message: cedulaError };
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return { ok: false, message: passwordError };
        }

        if (this._users().some((user) => user.cedula === normalizedCedula)) {
            return { ok: false, message: 'Ya existe un usuario registrado con esa cédula.' };
        }

        const newUser: AppUser = {
            id: nextSequentialId('USR', this._users().map((user) => user.id)),
            fullName: name,
            cedula: normalizedCedula,
            password: password.toUpperCase(),
            role: 'Administrador',
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

    resetPassword(cedula: string, newPassword: string, answeredQuestions?: { question: string; answer: string }[]): AuthResult {
        const normalizedCedula = normalizeCedula(cedula);
        const user = this._users().find((item) => item.cedula === normalizedCedula);

        if (!user) {
            const deleted = this.deletedUserRecord(normalizedCedula);
            return { ok: false, message: deleted ? this.deletedUserMessage(deleted) : 'No se encontró ningún usuario con esa cédula.' };
        }

        if (!user.active) {
            return { ok: false, message: this.deactivatedUserMessage(user) };
        }

        // Validate security questions if the user has them
        if (user.securityQuestions && user.securityQuestions.length > 0) {
            if (!answeredQuestions || answeredQuestions.length === 0) {
                return { ok: false, message: 'Debes responder las preguntas de seguridad.' };
            }
            const incorrectQuestions = user.securityQuestions
                .filter((sq) => {
                    const answered = answeredQuestions.find((aq) => aq.question === sq.question);
                    return !answered || answered.answer.trim().toLowerCase() !== sq.answer.trim().toLowerCase();
                })
                .map((sq) => sq.question);
            if (incorrectQuestions.length > 0) {
                return { ok: false, message: 'Una o más respuestas de seguridad son incorrectas.', incorrectQuestions };
            }
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return { ok: false, message: passwordError };
        }

        const updated: AppUser = { ...user, password: newPassword.toUpperCase() };
        this._users.update((users) => users.map((item) => (item.id === updated.id ? updated : item)));
        this.persistUsers();
        this.logService.record(
            'Contraseña restablecida',
            `${updated.fullName} restableció su contraseña de acceso.`,
            updated.fullName,
            updated.id
        );

        return { ok: true, message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' };
    }

    verifySecurityQuestions(cedula: string, answeredQuestions: { question: string; answer: string }[]): AuthResult {
        const normalizedCedula = normalizeCedula(cedula);
        const user = this._users().find((item) => item.cedula === normalizedCedula);

        if (!user) {
            const deleted = this.deletedUserRecord(normalizedCedula);
            return { ok: false, message: deleted ? this.deletedUserMessage(deleted) : 'No se encontró ningún usuario con esa cédula.' };
        }
        if (!user.active) {
            return { ok: false, message: this.deactivatedUserMessage(user) };
        }
        if (!user.securityQuestions?.length) {
            return { ok: false, message: 'Este usuario no tiene preguntas de seguridad configuradas.' };
        }
        if (!answeredQuestions.length) {
            return { ok: false, message: 'Debes responder todas las preguntas de seguridad.' };
        }

        const incorrectQuestions = user.securityQuestions
            .filter((securityQuestion) => {
                const answered = answeredQuestions.find((item) => item.question === securityQuestion.question);
                return !answered || answered.answer.trim().toLowerCase() !== securityQuestion.answer.trim().toLowerCase();
            })
            .map((securityQuestion) => securityQuestion.question);

        return incorrectQuestions.length === 0
            ? { ok: true, message: 'Respuestas verificadas correctamente.' }
            : { ok: false, message: 'Una o más respuestas de seguridad son incorrectas.', incorrectQuestions };
    }

    getSecurityQuestions(cedula: string): { ok: boolean; questions: string[]; message: string } {
        const normalizedCedula = normalizeCedula(cedula);
        const user = this._users().find((item) => item.cedula === normalizedCedula);
        if (!user) {
            const deleted = this.deletedUserRecord(normalizedCedula);
            return { ok: false, questions: [], message: deleted ? this.deletedUserMessage(deleted) : 'No se encontró ningún usuario con esa cédula.' };
        }
        if (!user.active) {
            return { ok: false, questions: [], message: this.deactivatedUserMessage(user) };
        }
        if (!user.securityQuestions || user.securityQuestions.length === 0) {
            return { ok: true, questions: [], message: 'Este usuario no tiene preguntas de seguridad configuradas.' };
        }
        return { ok: true, questions: user.securityQuestions.map((sq) => sq.question), message: '' };
    }

    createUser(input: NewUserInput): AuthResult {
        if (!this.isAdmin()) {
            return { ok: false, message: 'Solo un administrador puede crear usuarios.' };
        }

        const name = input.fullName.trim();
        const normalizedCedula = normalizeCedula(input.cedula);

        if (name.length < 3) {
            return { ok: false, message: 'Escribe el nombre completo del usuario.' };
        }

        const cedulaError = validateCedula(input.cedula);
        if (cedulaError) {
            return { ok: false, message: cedulaError };
        }

        const passwordError = validatePassword(input.password);
        if (passwordError) {
            return { ok: false, message: passwordError };
        }

        if (this._users().some((user) => user.cedula === normalizedCedula)) {
            return { ok: false, message: 'Ya existe un usuario con esa cédula.' };
        }

        const actor = this.currentUser()?.fullName ?? 'Sistema';
        const newUser: AppUser = {
            id: nextSequentialId('USR', this._users().map((user) => user.id)),
            fullName: name,
            cedula: normalizedCedula,
            password: input.password.toUpperCase(),
            role: 'Administrador',
            active: input.active,
            createdAt: new Date().toISOString(),
            createdBy: actor,
            securityQuestions: (input.securityQuestions ?? []).map((question) => ({
                question: question.question,
                answer: question.answer.toUpperCase()
            }))
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
        const normalizedCedula = normalizeCedula(input.cedula);

        if (name.length < 3) {
            return { ok: false, message: 'Escribe el nombre completo del usuario.' };
        }

        const cedulaError = validateCedula(input.cedula);
        if (cedulaError) {
            return { ok: false, message: cedulaError };
        }

        if (normalizedCedula !== user.cedula) {
            return { ok: false, message: 'La cédula de un usuario no se puede modificar.' };
        }

        const isSelf = this._currentUser()?.id === id;

        if (isSelf && !input.active) {
            return { ok: false, message: 'No puedes deshabilitar tu propia cuenta.' };
        }

        if (input.password?.trim() && !isSelf) {
            return { ok: false, message: 'Solo el propio usuario puede cambiar su contraseña.' };
        }

        if (input.securityQuestions !== undefined && !isSelf) {
            return { ok: false, message: 'Solo el propio usuario puede ver o cambiar sus preguntas de seguridad.' };
        }

        if (this._users().some((item) => item.id !== id && item.cedula === normalizedCedula)) {
            return { ok: false, message: 'Ya existe otro usuario con esa cédula.' };
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

        const isDeactivating = user.active && !input.active;
        const deactivationReason = (input.deactivationReason ?? '').trim();

        if (isDeactivating && !deactivationReason) {
            return { ok: false, message: 'Escribe el motivo de la deshabilitación.' };
        }

        const actor = this.currentUser()?.fullName ?? 'Sistema';
        const updated: AppUser = {
            ...user,
            fullName: name,
            cedula: normalizedCedula,
            role: 'Administrador',
            active: input.active,
            password: input.password?.trim() ? input.password.toUpperCase() : user.password,
            securityQuestions:
                input.securityQuestions !== undefined
                    ? input.securityQuestions.map((question) => ({
                          question: question.question,
                          answer: question.answer.toUpperCase()
                      }))
                    : user.securityQuestions,
            ...(input.active
                ? { deactivatedBy: undefined, deactivationReason: undefined }
                : { deactivatedBy: user.deactivatedBy ?? actor, deactivationReason: user.deactivationReason ?? (deactivationReason || undefined) })
        };

        this._users.update((users) => users.map((item) => (item.id === id ? updated : item)));
        this.persistUsers();

        if (this._currentUser()?.id === id) {
            this._currentUser.set(updated);
        }

        this.logService.record('Usuario actualizado', `${actor} actualizó los datos del usuario ${updated.fullName}.`, actor, updated.id);

        return { ok: true, message: 'Usuario actualizado correctamente.' };
    }

    toggleUser(id: string, deactivationReason?: string): AuthResult {
        if (!this.isAdmin()) {
            return { ok: false, message: 'Solo un administrador puede cambiar el estado de los usuarios.' };
        }

        if (this._currentUser()?.id === id) {
            return { ok: false, message: 'No puedes deshabilitar tu propia cuenta.' };
        }

        const user = this._users().find((item) => item.id === id);
        if (!user) {
            return { ok: false, message: 'El usuario no existe.' };
        }

        if (user.active && user.role === 'Administrador' && this.isLastActiveAdmin(user.id)) {
            return { ok: false, message: 'No puedes deshabilitar al último administrador activo.' };
        }

        const reason = (deactivationReason ?? '').trim();

        if (user.active && !reason) {
            return { ok: false, message: 'Escribe el motivo de la deshabilitación.' };
        }

        const actor = this.currentUser()?.fullName ?? 'Sistema';
        const updated: AppUser = user.active
            ? { ...user, active: false, deactivatedBy: actor, deactivationReason: reason }
            : { ...user, active: true, deactivatedBy: undefined, deactivationReason: undefined };
        this._users.update((users) => users.map((item) => (item.id === id ? updated : item)));
        this.persistUsers();

        this.logService.record(
            updated.active ? 'Usuario habilitado' : 'Usuario deshabilitado',
            updated.active
                ? `${actor} habilitó al usuario ${updated.fullName}.`
                : `${actor} deshabilitó al usuario ${updated.fullName}. Motivo: ${reason}.`,
            actor,
            updated.id
        );

        return { ok: true, message: `Usuario ${updated.active ? 'habilitado' : 'deshabilitado'} correctamente.` };
    }

    deleteUser(id: string, deletionReason?: string): AuthResult {
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

        const reason = (deletionReason ?? '').trim();

        if (!reason) {
            return { ok: false, message: 'Escribe el motivo de la eliminación.' };
        }

        const actor = this.currentUser()?.fullName ?? 'Sistema';
        this._deletedUsers.update((records) => [
            {
                id: user.id,
                fullName: user.fullName,
                cedula: user.cedula,
                role: user.role,
                deletedBy: actor,
                deletionReason: reason,
                deletedAt: new Date().toISOString()
            },
            ...records
        ]);
        this.persistDeletedUsers();

        this._users.update((users) => users.filter((item) => item.id !== id));
        this.persistUsers();

        this.logService.record('Usuario eliminado', `${actor} eliminó al usuario ${user.fullName}. Motivo: ${reason}.`, actor, user.id);

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

    private bootstrap(): void {
        const users = this.storage.read<Partial<AppUser>[]>(STORAGE_KEYS.users, []);
        const normalizedUsers: AppUser[] = users.length
            ? users.map((user) => ({
                  id: user.id ?? '',
                  fullName: user.fullName ?? '',
                  cedula: user.cedula?.trim()
                      ? normalizeCedula(user.cedula)
                      : user.id === DEFAULT_ADMIN.id && user.role === 'Administrador'
                        ? DEFAULT_ADMIN.cedula
                        : '',
                  password: user.password ?? '',
                  role: 'Administrador' as UserRole,
                  active: user.active ?? false,
                  createdAt: user.createdAt ?? new Date().toISOString(),
                  createdBy: user.createdBy ?? 'Sistema',
                  ...(user.deactivatedBy ? { deactivatedBy: user.deactivatedBy } : {}),
                  ...(user.deactivationReason ? { deactivationReason: user.deactivationReason } : {}),
                  ...(user.lastLogin ? { lastLogin: user.lastLogin } : {}),
                  ...(user.securityQuestions ? { securityQuestions: user.securityQuestions } : {})
              }))
            : [DEFAULT_ADMIN];

        this._users.set(normalizedUsers);
        this.persistUsers();

        this._deletedUsers.set(this.storage.read<DeletedUserRecord[]>(STORAGE_KEYS.deletedUsers, []));

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

    private persistDeletedUsers(): void {
        this.storage.write(STORAGE_KEYS.deletedUsers, this._deletedUsers());
    }

    private deletedUserRecord(cedula: string): DeletedUserRecord | undefined {
        return this._deletedUsers().find((record) => record.cedula === cedula);
    }

    private deletedUserMessage(record: DeletedUserRecord): string {
        const reason = record.deletionReason.trim();
        const reasonText = reason ? ` Motivo: ${reason}${/[.!?]$/.test(reason) ? '' : '.'}` : '';
        return `Esta cuenta fue eliminada por ${record.deletedBy}.${reasonText} Si deseas volver a ingresar, un administrador debe crear tu cuenta nuevamente.`;
    }

    private deactivatedUserMessage(user: AppUser): string {
        const deactivatedBy = user.deactivatedBy ?? 'un administrador';
        const reason = user.deactivationReason?.trim();
        const reasonText = reason ? ` Motivo: ${reason}${/[.!?]$/.test(reason) ? '' : '.'}` : '';
        return `Esta cuenta fue deshabilitada por ${deactivatedBy}.${reasonText} Contacta a un administrador.`;
    }

    private isLastActiveAdmin(id: string): boolean {
        return this._users().filter((user) => user.role === 'Administrador' && user.active && user.id !== id).length === 0;
    }

}
