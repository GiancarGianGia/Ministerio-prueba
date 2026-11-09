import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/services/auth.service';
import { AppUser, NewUserInput, TagSeverity, UpdateUserInput } from '@/app/services/models';

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        PasswordModule,
        SelectModule,
        TableModule,
        TagModule,
        ToastModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './usuarios.html'
})
export class Usuarios {
    readonly auth = inject(AuthService);

    private readonly messageService = inject(MessageService);

    private readonly confirmationService = inject(ConfirmationService);

    readonly users = this.auth.users;

    readonly activeUsers = this.auth.activeUsers;

    readonly adminUsers = this.auth.adminUsers;

    readonly roleOptions = this.auth.roleOptions;

    userDialog = false;

    editing = false;

    submitted = false;

    editingId: string | null = null;

    userForm: NewUserInput = this.emptyUser();

    openNew(): void {
        this.editing = false;
        this.editingId = null;
        this.submitted = false;
        this.userForm = this.emptyUser();
        this.userDialog = true;
    }

    editUser(user: AppUser): void {
        this.editing = true;
        this.editingId = user.id;
        this.submitted = false;
        this.userForm = {
            fullName: user.fullName,
            email: user.email,
            password: '',
            role: user.role,
            active: user.active
        };
        this.userDialog = true;
    }

    hideDialog(): void {
        this.userDialog = false;
        this.submitted = false;
    }

    saveUser(): void {
        this.submitted = true;

        if (!this.userForm.fullName.trim() || !this.userForm.email.trim() || (!this.editing && this.userForm.password.length < 6)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Formulario incompleto',
                detail: 'Completa el nombre, el correo y una contraseña de al menos 6 caracteres.',
                life: 3500
            });
            return;
        }

        let result;

        if (this.editing && this.editingId) {
            const input: UpdateUserInput = {
                fullName: this.userForm.fullName,
                email: this.userForm.email,
                role: this.userForm.role,
                active: this.userForm.active,
                password: this.userForm.password
            };
            result = this.auth.updateUser(this.editingId, input);
        } else {
            result = this.auth.createUser(this.userForm);
        }

        if (!result.ok) {
            this.messageService.add({
                severity: 'error',
                summary: 'No se pudo guardar',
                detail: result.message,
                life: 4000
            });
            return;
        }

        this.userDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: this.editing ? 'Usuario actualizado' : 'Usuario creado',
            detail: result.message,
            life: 3500
        });
    }

    toggleUser(user: AppUser): void {
        this.confirmationService.confirm({
            message: `¿Deseas ${user.active ? 'desactivar' : 'activar'} a ${user.fullName}?`,
            header: user.active ? 'Desactivar usuario' : 'Activar usuario',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: user.active ? 'Desactivar' : 'Activar',
            rejectLabel: 'Cancelar',
            accept: () => {
                const result = this.auth.toggleUser(user.id);
                this.messageService.add({
                    severity: result.ok ? 'success' : 'error',
                    summary: result.ok ? 'Estado actualizado' : 'No se pudo actualizar',
                    detail: result.message,
                    life: 3500
                });
            }
        });
    }

    deleteUser(user: AppUser): void {
        this.confirmationService.confirm({
            message: `¿Deseas eliminar permanentemente la cuenta de ${user.fullName}?`,
            header: 'Eliminar usuario',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const result = this.auth.deleteUser(user.id);
                this.messageService.add({
                    severity: result.ok ? 'success' : 'error',
                    summary: result.ok ? 'Usuario eliminado' : 'No se pudo eliminar',
                    detail: result.message,
                    life: 3500
                });
            }
        });
    }

    isCurrentUser(user: AppUser): boolean {
        return this.auth.currentUser()?.id === user.id;
    }

    initials(fullName: string): string {
        return fullName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase();
    }

    getRoleSeverity(role: string): TagSeverity {
        switch (role) {
            case 'Administrador':
                return 'contrast';
            case 'Registrador':
                return 'info';
            default:
                return 'secondary';
        }
    }

    private emptyUser(): NewUserInput {
        return {
            fullName: '',
            email: '',
            password: '',
            role: 'Registrador',
            active: true
        };
    }
}
