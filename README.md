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
- `src/assets/styles.scss`: diseño global blanco y azul.

## Guía rápida: APIs y redes

### ¿Qué es una API?

Una API es una forma definida para que dos programas se comuniquen. Por ejemplo, una aplicación web puede pedirle a un servidor la lista de trabajadores o enviarle un registro nuevo.

### ¿Qué es un endpoint?

Es una dirección de la API que permite realizar una operación. La dirección y el método HTTP indican qué se quiere hacer:

| Método y endpoint | Uso habitual |
| --- | --- |
| `GET /api/personas` | Consultar personas |
| `GET /api/personas/123` | Consultar una persona |
| `POST /api/personas` | Crear una persona |
| `PUT /api/personas/123` | Actualizar una persona |
| `DELETE /api/personas/123` | Eliminar una persona |

Estos endpoints son ejemplos: deben existir en el servidor para poder utilizarlos.

### ¿Qué es OpenAPI?

OpenAPI es un estándar para describir una API: sus endpoints, los datos que acepta, las respuestas y la autenticación. La descripción suele guardarse como `openapi.yaml` o `openapi.json`. Herramientas como Swagger UI pueden mostrarla y permitir probar las solicitudes. OpenAPI documenta una API; no crea el servidor ni implica que la API sea pública.

### ¿Cómo se usan APIs públicas o gratuitas?

1. Consultar la documentación para conocer los endpoints, métodos, formatos y límites.
2. Revisar si hace falta una cuenta o una clave de acceso.
3. Enviar una solicitud HTTP desde la aplicación.
4. Procesar la respuesta, que a menudo está en formato JSON.

“Pública” no necesariamente significa gratuita o ilimitada. También pueden existir límites de uso o restricciones CORS que impiden llamar a la API directamente desde el navegador. Para practicar, usar datos ficticios; no enviar documentos personales a APIs de demostración.

### ¿Cómo se conecta Angular con un servidor?

`HttpClient` permite enviar solicitudes HTTP desde Angular. En este proyecto ya está habilitado en `src/app.config.ts` mediante `provideHttpClient(withFetch())`, pero todavía no está conectado a una API de backend para guardar trabajadores.

El flujo actual es:

```text
Formulario → PersonService → localStorage del navegador
```

Al conectar un backend, el flujo sería:

```text
Formulario → PersonService → HttpClient → API del servidor → base de datos
```

Ejemplo de una consulta de prueba a una API pública con Angular:

```ts
this.http.get('https://jsonplaceholder.typicode.com/users').subscribe({
    next: (users) => console.log(users),
    error: (error) => console.error('No se pudo consultar la API', error)
});
```

Para registrar trabajadores, el backend debe ofrecer un endpoint —por ejemplo `POST /api/personas`—, validar los datos, verificar duplicados y responder con el registro creado. Las validaciones del navegador ayudan a la experiencia, pero el servidor también debe validar. La autenticación y los permisos deben aplicarse en el backend. No se deben incluir claves secretas en el código del navegador.

Como el sistema maneja datos personales, una integración real debe usar un servidor autorizado, HTTPS y controles adecuados de acceso y protección de datos.

### ¿Qué es una IP privada?

Es una dirección usada dentro de una red interna, como la de una casa u oficina. No es directamente accesible desde Internet. Rangos privados comunes:

- `10.0.0.0` a `10.255.255.255`
- `172.16.0.0` a `172.31.255.255`
- `192.168.0.0` a `192.168.255.255`

Una API en una IP privada normalmente solo se puede alcanzar desde esa red o mediante una VPN. Por eso, una dirección local de servidor puede funcionar en la oficina, pero no necesariamente desde fuera.

## Comentarios retirados del código

Se retiraron del código los comentarios que se enumeran aquí. Las referencias de línea indican su ubicación original antes de retirarlos.

### `src/assets/styles.scss`

- Línea 42, junto a `.layout-wrapper`: `Estructura general`.
- Línea 225, junto a las reglas de estado del menú: `Estados del menú`.
- Línea 505, antes de `.table-caption`: `Tablas y celdas`.
- Línea 651, antes de `.form-grid`: `Formularios`.
- Línea 922, antes de `.activity-list`: `Actividad y distribución`.
- Línea 1039, antes de `.auth-page`: `Autenticación`.
- Línea 1406, antes de `.notfound-page`: `404`.
- Línea 1467, antes de las reglas `@media`: `Responsive`.
- Cada encabezado anterior estaba rodeado por líneas separadoras de `=` dentro de un comentario CSS.

### `src/app/services/models.ts`

Los siguientes comentarios estaban dentro de la lista `PERSON_TYPES` y agrupaban los cargos:

- Línea 84: `Cargos generales`.
- Línea 92: `OTIC – Dirección / Coordinación`.
- Línea 97: `OTIC – Infraestructura y Redes`.
- Línea 105: `OTIC – Desarrollo y Programación`.
- Línea 114: `OTIC – Bases de Datos`.
- Línea 117: `OTIC – Sistemas y Proyectos`.
- Línea 123: `OTIC – Datos e Inteligencia Artificial`.
- Línea 128: `OTIC – Gestión Documental y Otros`.

### `src/app/services/validators.ts`

- Línea 7, antes de `isValidEmail`: `Valida si un correo electrónico cumple con el formato estándar RFC.`
- Línea 15, antes de `validateEmail`: `Retorna el mensaje de error para el correo electrónico o null si es válido.`
- Línea 32, antes de `isValidVenezuelanPhone`: `Valida teléfonos con código de área venezolano (móviles 0412, 0414, 0416, 0424, 0426 o fijos 02xx).`
- Línea 195, antes de `isValidPassword`: `Valida si una contraseña cumple con los requisitos de seguridad.`
- Línea 202, antes de `validatePasswordConfirmation`: `Valida que la confirmación de la contraseña coincida con la contraseña original.`

### `src/app/services/person.service.spec.ts`

- Línea 5, antes de `makePersonInput`: `Genera un input de persona con valores por defecto sobreescribibles`.
- Línea 65, en la prueba de `documentExists()`: `Al editar la misma persona, su propio documento no debe contar como duplicado`.

### `src/app/services/storage.service.ts`

- Línea 18, en el bloque `catch` de `write()`: `El sistema sigue funcionando en memoria si el navegador bloquea el almacenamiento.`
- Línea 26, en el bloque `catch` de `remove()`: `Sin acción.`

### Archivos de configuración TypeScript

En las líneas 1 y 2 originales de cada archivo estaban estos comentarios:

- `To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html.`
- `To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options.`

Ubicaciones: `tsconfig.json`, `tsconfig.app.json` y `tsconfig.spec.json`.
