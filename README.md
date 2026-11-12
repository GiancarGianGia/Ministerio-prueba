# MPPPST · Sistema de Administración y Actualización de Trabajadores

Aplicación Angular + PrimeNG para actualizar y administrar a los trabajadores del Ministerio del Poder Popular para el Proceso Social de Trabajo en Caracas, Venezuela. El sistema está enfocado en la actualización y administración de datos de trabajadores ya existentes (cargados desde base de datos o precargados).

> **Nota importante:** En esta plataforma únicamente se registran los usuarios con rol de **Administrador**. Los trabajadores no se registran desde la interfaz pública, sino que se gestionan, consultan, actualizan e inhabilitan.

## Funcionalidades

- Inicio de sesión y registro exclusivo para usuarios **Administradores**.
- Panel con estadísticas de trabajadores, distribución por cargo y últimas actualizaciones.
- Gestión integral de trabajadores: actualización de datos personales, familiares, vacaciones, médicos, habitacionales y adicionales.
- Inhabilitación de trabajadores con motivo obligatorio y registro en bitácora.
- Exportación en formatos CSV y Excel con fecha de última actualización.
- Administración de usuarios administradores (crear, editar, activar/desactivar y restablecer contraseñas).
- Bitácora automática de ingresos, actualizaciones y cambios de estado.
- Persistencia local en el navegador (`localStorage`) preparada para futura integración con API/BD.

## Acceso de prueba

| Cédula | Contraseña | Rol |
| --- | --- | --- |
| `V-00000000` | `admin123` | Administrador |

También puedes registrar una nueva cuenta desde **Crear una cuenta**. Todas las cuentas creadas se registran automáticamente como **Administrador**.

## Servidor de desarrollo

```bash
npm install
npm start
```

Abre `http://localhost:4200/`.

## Compilación

```bash
npm run build
```

## Estructura principal

- `src/app/pages/auth`: inicio de sesión y registro de administradores.
- `src/app/pages/dashboard`: panel principal con últimos trabajadores actualizados.
- `src/app/pages/personas`: listado, filtros, inhabilitación y formulario modal por pestañas para actualizar trabajadores.
- `src/app/pages/usuarios`: administración de usuarios administradores.
- `src/app/pages/actividad`: bitácora de auditoría del sistema.
- `src/app/services`: modelos de datos, servicios de trabajadores, autenticación y bitácora.
- `src/assets/styles.scss`: diseño global blanco y azul institucional.
