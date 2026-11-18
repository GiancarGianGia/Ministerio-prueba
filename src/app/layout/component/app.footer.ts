import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        <span>Ministerio del Poder Popular para el Trabajo - Oficina de Tecnologías de la Información y la Comunicación - División de Análisis y Desarrollo de Sistemas</span>
        <span>© {{ year }} Todos los Derechos Reservados</span>
    </div>`
})
export class AppFooter {
    readonly year = new Date().getFullYear();
}
