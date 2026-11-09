import { Routes } from '@angular/router';
import { publicGuard } from '@/app/services/auth.guard';
import { Login } from './login';
import { Register } from './register';

export default [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login, canActivate: [publicGuard] },
    { path: 'registro', component: Register, canActivate: [publicGuard] },
    { path: '**', redirectTo: 'login' }
] as Routes;
