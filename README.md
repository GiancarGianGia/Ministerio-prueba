# MPPPST · Sistema de Administración y Actualización de Trabajadores

Aplicación Angular + PrimeNG para actualizar y administrar a los trabajadores del Ministerio del Poder Popular para el Proceso Social de Trabajo en Caracas, Venezuela. El sistema está enfocado en la actualización y administración de datos de trabajadores ya existentes (cargados desde base de datos o precargados).

> **Nota importante:** En esta plataforma únicamente se registran los usuarios con rol de **Administrador**. Los trabajadores no se registran desde la interfaz pública, sino que se gestionan, consultan, actualizan e inhabilitan.

## Funcionalidades

- Inicio de sesión y registro exclusivo para usuarios **Administradores**.
- Recuperación de contraseña mediante preguntas de seguridad: botón de ojo para mostrar/ocultar respuestas, resaltado rojo en la pregunta respondida de forma incorrecta y sin revelar la respuesta automáticamente.
- Contraseñas y respuestas de seguridad en **mayúsculas** (el inicio de sesión sigue aceptando contraseñas en minúsculas de cuentas antiguas).
- Panel con estadísticas de trabajadores, distribución por cargo y últimas actualizaciones.
- Gestión integral de trabajadores: actualización por pestañas de datos personales, laborales, familiares, vacaciones, médicos, habitacionales, adicionales y académicos, con lista de pestañas desplazable horizontalmente.
- Selector de tipo de documento por prefijo (V, E, P, J, G, C); en la actualización del trabajador se muestran las opciones con su nombre completo (ej. «V — Venezolano (Cédula de identidad)»).
- Las cédulas se registran siempre con el tipo de documento (V o E) y el número sin puntos (ej. `V-18745632`); los formularios muestran el mensaje «La cédula debe llevar el tipo de documento y el número sin puntos» y las cédulas antiguas almacenadas con puntos se migran automáticamente al formato sin puntos.
- Datos laborales con adscripción administrativa (estado, ubicación física, teléfono de oficina), cargo titular y cargo que ejerce, tipo de trabajador, código de nómina y fechas de ingreso.
- Dirección de habitación con estado, municipio y parroquia dependientes, selección de tipo de dirección por grupos de radios (vía, edificación, inmueble y zona) con sus detalles y punto de referencias; estado, ciudad y dirección se gestionan en esta sección.
- Calendarios en formato día/mes/año y validación de fechas imposibles.
- Validación de cédulas y teléfonos con estructura venezolana en los formularios.
- Inhabilitación de trabajadores con motivo obligatorio y registro en bitácora.
- Exportación en formatos CSV y Excel; el Excel incluye la cantidad de hijos sin exportar sus datos individuales.
- Administración de usuarios administradores (crear, editar datos básicos, activar/desactivar y eliminar). La cédula es ineditable porque proviene de la base de datos cuando el usuario crea su cuenta, y la contraseña junto con las preguntas de seguridad solo pueden verlas y cambiarlas el propio usuario desde su propia cuenta.
- Bitácora automática de ingresos, actualizaciones y cambios de estado.
- Persistencia local en el navegador (`localStorage`) preparada para futura integración con API/BD.

## Acceso de prueba

| Cédula | Contraseña | Rol |
| --- | --- | --- |
| `V-00000000` | `ADMIN123` | Administrador |

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

## Pruebas

```bash
npm test -- --watch=false
```

## Estructura principal

- `src/app/pages/auth`: inicio de sesión y registro de administradores.
- `src/app/pages/dashboard`: panel principal con últimos trabajadores actualizados.
- `src/app/pages/personas`: listado, filtros, inhabilitación y formulario modal por pestañas para actualizar trabajadores.
- `src/app/pages/usuarios`: administración de usuarios administradores.
- `src/app/pages/actividad`: bitácora de auditoría del sistema.
- `src/app/services`: modelos de datos, servicios de trabajadores, autenticación y bitácora.
- `src/assets/styles.scss`: diseño global blanco y azul institucional.
