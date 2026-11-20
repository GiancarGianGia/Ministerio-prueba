# MPPPST · Sistema de Administración y Actualización de Trabajadores

Aplicación web desarrollada con **Angular 21**, **PrimeNG 21** y **Tailwind CSS** para la administración, actualización y auditoría de los datos de los trabajadores del **Ministerio del Poder Popular para el Proceso Social de Trabajo** (Caracas, Venezuela).

> **Nota importante:** En esta plataforma únicamente se registran los usuarios con rol de **Administrador**. Los trabajadores provienen de la base de datos institucional y el sistema permite consultar, actualizar, auditar su expediente y gestionar su estado (*Activo* o *Egresado*).

---

## 🚀 Módulos y Funcionalidades

### 1. Autenticación y Seguridad (`/auth`)
- **Acceso exclusivo para Administradores:** Control de rutas mediante `authGuard` y `adminGuard`.
- **Registro institucional:** Formulario validado para nuevos administradores del sistema.
- **Recuperación de contraseña:** Mediante preguntas de seguridad personalizadas con alternador de visibilidad (icono de ojo) y validación visual de errores sin exponer la respuesta.
- **Normalización de credenciales:** Contraseñas y respuestas de seguridad en mayúsculas automáticas (manteniendo compatibilidad con cuentas históricas).

### 2. Panel de Control (`/`)
- Estadísticas en tiempo real: total de trabajadores, trabajadores activos, egresados y desglose por adscripción laboral.
- Gráficos interactivos de distribución por cargo y estatus.
- Historial reciente de últimas actualizaciones realizadas.

### 3. Gestión y Expediente de Trabajadores (`/personas`)
- **Filtros avanzados y búsqueda global:** Filtrado instantáneo por cédula, nombre, departamento, estatus y tipo de trabajador.
- **Modal de actualización por 8 pestañas:**
  1. **Básicos:** Nombres, apellidos, cédula (prefijos V, E, P, J, G, C), sexo, estado civil, fecha y lugar de nacimiento, teléfonos y correo.
  2. **Laborales:** Adscripción administrativa, ubicación física, teléfono de oficina, cargo titular, cargo que ejerce, tipo de trabajador, código de nómina y fechas de ingreso.
  3. **Habitacionales:** Dirección jerárquica dependiente (Estado $\rightarrow$ Municipio $\rightarrow$ Parroquia), clasificación detallada por grupos de selección (vía, edificación, inmueble, zona) y puntos de referencia.
  4. **Médicos:** Grupo sanguíneo, patologías, alergias y catálogo de más de 1.600 tratamientos.
  5. **Familiares:** Carga de familiares y dependientes con validación de parentesco y fechas de nacimiento.
  6. **Académicos:** Nivel educativo, profesión, institución y año de egreso.
  7. **Vacaciones:** Control de periodos vacacionales, días correspondientes y estatus de disfrute.
  8. **Adicionales:** Talla de uniforme, calzado y observaciones institucionales.
- **Detección de cambios sin guardar:** Alerta interactiva con `ConfirmDialog` al intentar cerrar el modal si existen modificaciones no guardadas (mediante snapshot de estado).
- **Impresión de Ficha Oficial:** Generación automática de la ficha técnica institucional del trabajador en ventana imprimible con membrete oficial del MPPPST, las 8 secciones consolidadas y área para firmas y sellos.
- **Autocompletado de Tratamientos:** Catálogo precargado de más de 1.600 tratamientos y medicamentos con búsqueda predictiva (`p-autoComplete`).
- **Exportación de expedientes:** Servicio desacoplado `PersonExportService` para exportación en **Excel (.xlsx)** y **CSV**, con conteo consolidado de hijos.

### 4. Administración de Usuarios (`/usuarios`)
- Gestión centralizada de usuarios administradores.
- Alta, edición de datos de contacto, eliminación y activación/desactivación con motivo obligatorio justificado.
- Protección estricta de credenciales: cédula ineditable y preguntas de seguridad gestionadas exclusivamente por cada usuario.

### 5. Bitácora de Auditoría (`/actividad`)
- Registro automatizado de eventos clave del sistema: inicios de sesión, creaciones, modificaciones de trabajadores y cambios de estado laboral.
- Traza de auditoría con fecha, hora, usuario responsable y detalle de la operación.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** Angular 21 (Standalone Components, Signals, Reactive Forms)
- **Componentes UI:** PrimeNG 21 + PrimeIcons
- **Estilos:** Tailwind CSS + PostCSS + Tema institucional MPPPST
- **Exportación:** SheetJS (`xlsx`) y `fflate`
- **Gráficos:** Chart.js
- **Tipado y Arquitectura:** Tipado estricto con `as const`, DTOs de comunicación API (`ApiResponse<T>`, `CreatePersonDto`, `UpdatePersonDto`) y modelos fuertemente tipados.
- **Testing:** Jasmine + Karma (más de 80 pruebas unitarias automatizadas).

---

## 💻 Entorno de Desarrollo

### Requisitos previos
- Node.js (v18 o superior recomendado)
- npm

### Instalación de dependencias
Desde la carpeta del proyecto (`Frontend`):
```bash
npm install
```

### Ejecutar servidor local
```bash
npm start
```
La aplicación estará disponible en `http://localhost:4200/`.

---

## 🧪 Pruebas Unitarias

Para ejecutar la suite completa de pruebas:
```bash
npm test -- --watch=false
```

---

## 📦 Compilación y Despliegue

### Compilar para producción
```bash
npm run build
```
Los archivos optimizados para producción se generarán en:
```
dist/sakai-ng/browser/
```

### Subida al Servidor Web (FileZilla / SFTP)
1. Conéctate a tu servidor mediante SFTP/FTP.
2. Navega a la raíz pública del servidor web (comúnmente `/var/www/html` o `/var/www`).
3. Sube el **contenido** de la carpeta `dist/sakai-ng/browser` (archivos `index.html`, `.js`, `.css` y la carpeta `media`).

---

## 📂 Estructura del Código

```
Frontend/
├── src/
│   ├── app/
│   │   ├── layout/               # Componentes de maquetación (navbar, sidebar, footer)
│   │   ├── pages/
│   │   │   ├── actividad/        # Bitácora de eventos y auditoría
│   │   │   ├── auth/             # Login, registro y recuperación de contraseña
│   │   │   ├── dashboard/        # Métricas y gráficas principales
│   │   │   ├── personas/         # Gestión integral de trabajadores y ficha técnica
│   │   │   └── usuarios/         # Control de administradores del sistema
│   │   └── services/
│   │       ├── auth.guard.ts     # Guardianes de ruta (authGuard, adminGuard)
│   │       ├── auth.service.ts   # Autenticación y almacenamiento de sesiones
│   │       ├── log.service.ts    # Auditoría y bitácora
│   │       ├── models.ts         # Modelos, DTOs y constantes 'as const'
│   │       ├── person-export.service.ts # Exportación a Excel y CSV
│   │       ├── person.service.ts # Lógica y almacenamiento de trabajadores
│   │       ├── treatment-catalog.ts     # Catálogo con +1600 medicamentos/tratamientos
│   │       └── validators.ts     # Validadores de cédula, nombres, correo y fechas
│   ├── assets/                   # Estilos institucionales globales (styles.scss) y recursos
│   └── app.routes.ts             # Definición de rutas del sistema
├── angular.json                  # Configuración de compilación Angular
├── package.json                  # Dependencias y scripts
└── vercel.json                   # Reglas de reescritura de rutas para producción
```
