# MPPPST · Gestión de Trabajadores

Aplicación web desarrollada con Angular 21 y PrimeNG para registrar, consultar y administrar a los trabajadores del Ministerio del Poder Popular para el Proceso Social de Trabajo en Caracas, Venezuela. La app permite llevar el control del Talento Humano, la actividad del sistema y la administración de usuarios desde un único panel.

## ¿Qué incluye el proyecto?

- Inicio de sesión con validación de cédula y contraseña.
- Registro de usuarios desde la interfaz, con acceso demo para pruebas.
- Panel principal con métricas de trabajadores, actividad reciente y distribución por cargo.
- Registro y actualización de información personal de cada trabajador.
- Filtros por estado, documento, departamento y cargo.
- Inhabilitación y reactivación de trabajadores con motivo de baja.
- Gestión de usuarios activos/inactivos.
- Bitácora automática de acciones del sistema.
- Exportación de datos en CSV y Excel desde la sección de trabajadores.
- Persistencia local del estado en el navegador mediante `localStorage`.
- Datos demo cargados al iniciar la aplicación para probar el flujo completo.

## Roles y acceso

El modelo del proyecto contempla roles como:

- `Administrador`
- `Registrador`
- `Consulta`

En la versión actual se prioriza el flujo administrativo con un usuario de prueba predeterminado y la creación de cuentas desde la propia app.

## Credenciales de prueba

| Cédula | Contraseña | Rol |
| --- | --- | --- |
| `V-00000000` | `admin123` | Administrador |

También puedes usar la opción de registro desde la pantalla de acceso para crear una nueva cuenta desde la interfaz.

## Stack tecnológico

- Angular 21
- PrimeNG
- PrimeIcons
- Tailwind CSS
- TypeScript
- localStorage para persistencia en frontend

## Iniciar el proyecto

Desde la carpeta del proyecto:

```bash
cd Formularo
npm install
npm start
```

La app quedará disponible en:

```text
http://localhost:4200/
```

## Compilar para producción

```bash
cd Formularo
npm run build
```

La salida se genera normalmente en `dist/sakai-ng/`.

## Estructura principal

- `src/app/pages/auth`: inicio de sesión, registro y acceso.
- `src/app/pages/dashboard`: panel principal con estadísticas.
- `src/app/pages/personas`: listado, filtros, edición y exportación de trabajadores.
- `src/app/pages/registro-persona`: formulario para registrar nuevos trabajadores.
- `src/app/pages/usuarios`: administración de usuarios.
- `src/app/pages/actividad`: historial y bitácora de eventos.
- `src/app/services`: modelos, autenticación, datos, persistencia y validadores.
- `src/assets/styles.scss`: estilos globales y sistema visual del proyecto.

## Personalización de cargos y departamentos

Los cargos y departamentos están definidos en:

```ts
src/app/services/models.ts
```

Puedes ajustar las constantes `PERSON_TYPES`, `DEPARTMENTS` y otros catálogos según la estructura real del ministerio o del proceso que quieras administrar.

## Nota

La aplicación está pensada para funcionar como sistema de gestión local en frontend, con almacenamiento del estado en el navegador y datos demo listos para probar el flujo sin requerir backend externo.
