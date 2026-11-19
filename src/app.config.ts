import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';

const RegistroPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#1c5ff0',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.600}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.700}',
                    activeColor: '{primary.800}'
                },
                highlight: {
                    background: '{primary.50}',
                    focusBackground: '{primary.100}',
                    color: '{primary.700}',
                    focusColor: '{primary.800}'
                }
            },
            dark: {
                primary: {
                    color: '{primary.400}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.300}',
                    activeColor: '{primary.200}'
                },
                highlight: {
                    background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                    focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                }
            }
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideZonelessChangeDetection(),
        providePrimeNG({
            theme: {
                preset: RegistroPreset,
                options: {
                    darkModeSelector: '.app-dark'
                }
            },
            translation: {
                dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
                dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
                dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
                monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
                firstDayOfWeek: 1,
                dateFormat: 'dd/mm/yy',
                today: 'Hoy',
                clear: 'Limpiar',
                weekHeader: 'Sem'
            },
            overlayAppendTo: 'body',
            overlayOptions: {
                listener: (_event: unknown, options?: { type?: string }) => {
                    if (options?.type === 'scroll') {
                        return false;
                    }
                    return true;
                }
            },
            zIndex: {
                modal: 1100,
                overlay: 1200,
                menu: 1200,
                tooltip: 1300
            },
            ripple: true
        })
    ]
};
