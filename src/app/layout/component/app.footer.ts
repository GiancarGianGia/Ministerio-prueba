import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        <span>Sistema de Registro de Trabajadores · Ministerio del Poder Popular para el Proceso Social de Trabajo</span>
        <span class="layout-footer-separator">·</span>
        <span>{{ year }} · Caracas, Venezuela</span>
    </div>`
})
export class AppFooter {
    readonly year = new Date().getFullYear();
}
