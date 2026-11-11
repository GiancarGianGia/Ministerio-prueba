import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Actividad } from './app/pages/actividad/actividad';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { Personas } from './app/pages/personas/personas';
import { RegistroPersona } from './app/pages/registro-persona/registro-persona';
import { Usuarios } from './app/pages/usuarios/usuarios';
import { adminGuard, authGuard } from './app/services/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'personas', component: Personas },
            { path: 'registro', redirectTo: 'personas', pathMatch: 'full' },
            { path: 'usuarios', component: Usuarios, canActivate: [adminGuard] },
            { path: 'actividad', component: Actividad }
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
