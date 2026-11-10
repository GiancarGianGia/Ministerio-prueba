# MPPPST · Sistema de Registro de Trabajadores

Aplicación Angular + PrimeNG para registrar, consultar y administrar a los trabajadores del Ministerio del Poder Popular para el Proceso Social de Trabajo en Caracas, Venezuela. Incluye control de usuarios por roles, bitácora de actividad y un diseño con paleta blanca y azul.

## Funcionalidades

- Inicio de sesión y auto-registro de cuentas.
- Roles `Administrador`, `Registrador` y `Consulta`.
- Panel con estadísticas de trabajadores, distribución por cargo y actividad reciente.
- Registro, edición, eliminación, filtros y exportación CSV de trabajadores.
- Fecha y hora de registro visibles en el panel, el listado, el formulario y la bitácora.
- Administración de usuarios (crear, editar, activar/desactivar y eliminar).
- Bitácora automática de ingresos, registros y cambios.
- Persistencia local en el navegador (`localStorage`).
- Datos de ejemplo: 8 trabajadores del Ministerio del Poder Popular para el Proceso Social de Trabajo en Caracas con cédulas `V-`, correos `@mpppst.gob.ve` y teléfonos `+58`.

## Acceso de prueba

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `admin@registro.com` | `admin123` | Administrador |

También puedes crear una cuenta desde **Crear una cuenta**. El auto-registro asigna el rol `Registrador` y la cuenta aparece de inmediato en la sección **Usuarios**.

## Cargos o puestos de trabajo

Los cargos disponibles en el selector **Cargo o puesto de trabajo** se definen en:

```
src/app/services/models.ts
```

Busca la constante `PERSON_TYPES` y agrega, edita o elimina los puestos según la estructura del ministerio:

```ts
export const PERSON_TYPES = ['Analista', 'Asistente administrativo', 'Supervisor', 'Director', 'Abogado', 'Trabajador obrero', 'Pasante'];
```

Los estados de Venezuela del selector **Estado** se encuentran en `DEPARTMENTS`, en el mismo archivo.

## Servidor de desarrollo

```bash
npm install
npm start
```

Abre `http://localhost:4200/`. La aplicación se recarga automáticamente al modificar los archivos.

## Compilación

```bash
npm run build
```

Los artefactos se generan en `dist/sakai-ng/`.

## Estructura principal

- `src/app/pages/auth`: inicio de sesión y registro de usuarios.
- `src/app/pages/dashboard`: panel principal del ministerio.
- `src/app/pages/personas`: listado y edición de trabajadores.
- `src/app/pages/registro-persona`: formulario de registro de trabajadores.
- `src/app/pages/usuarios`: administración de usuarios (solo administradores).
- `src/app/pages/actividad`: bitácora del sistema.
- `src/app/services`: modelos, autenticación, trabajadores, bitácora, almacenamiento y guards.
- `src/assets/styles.scss`: diseño global blanco y azul
