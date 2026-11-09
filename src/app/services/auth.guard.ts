import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.currentUser() ? true : router.createUrlTree(['/auth/login']);
};

export const adminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.currentUser()) {
        return router.createUrlTree(['/auth/login']);
    }

    return auth.isAdmin() ? true : router.createUrlTree(['/']);
};

export const publicGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.currentUser() ? router.createUrlTree(['/']) : true;
};
