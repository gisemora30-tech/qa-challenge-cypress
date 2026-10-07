# Challenge QA Automation — Gisela Mora

Pruebas automatizadas en JavaScript con Cypress para Fake Store API y Sauce Demo. Incluye el análisis y reporte de defectos de la tabla de movimientos.

## Requisitos e instalación

- Node.js 24 y npm.
- Cypress fijado en la versión 16.1.1.
- Acceso a Internet a los servicios de demostración.

Desde la carpeta donde está `package.json`, ejecutar:

```powershell
npm.cmd ci
```

En Windows se utiliza `npm.cmd` para evitar el bloqueo de `npm.ps1` por la política de PowerShell. En Linux o macOS, utilizar `npm`.

No hace falta ejecutar `npm start`: el proyecto prueba servicios publicados y no levanta una aplicación propia.

## Configuración de API

Para generar la configuración local:

```powershell
npm.cmd run setup:api
```

Este script obtiene un usuario del endpoint público `/users`, valida la respuesta y crea `cypress.env.json`. No imprime la contraseña ni sobrescribe un archivo existente. Este mecanismo utiliza datos públicos de demostración y no es apropiado para credenciales de producción.

Como alternativa manual:

1. Copiar `cypress.env.example.json` como `cypress.env.json`.
2. Configurar `apiUsername`, `apiPassword` y `apiUserId` con un usuario válido del servicio.
3. El ID debe ser numérico y corresponder al usuario configurado.

`cypress.env.json` está excluido mediante `.gitignore`.

También pueden configurarse las variables de entorno `CYPRESS_apiUsername`, `CYPRESS_apiPassword` y `CYPRESS_apiUserId`.

El token se obtiene durante la ejecución y se conserva en memoria. No se incluye una contraseña ni un token fijo en los tests.

## Ejecución

```powershell
npm.cmd run check
npm.cmd run test:ui
npm.cmd run test:api
npm.cmd test
npm.cmd run cy:open
```

| Script | Función |
| --- | --- |
| `check` | Revisa sintaxis; no reemplaza las pruebas funcionales. |
| `setup:api` | Genera la configuración local desde usuarios públicos. |
| `test:ui` | Ejecuta la compra en Sauce Demo. |
| `test:api` | Ejecuta login válido, login inválido y flujo del carrito. |
| `test` | Ejecuta ambas suites. |
| `cy:open` | Abre la interfaz de Cypress. |

Para observar la prueba UI en Chrome:

```powershell
npm.cmd run test:ui -- --browser chrome --headed
```

Sin indicar `--browser`, Cypress utiliza su navegador por defecto.

## Organización del proyecto

| Archivo o carpeta | Responsabilidad |
| --- | --- |
| `cypress.config.js` | Configuración de URLs, tests, viewport, timeouts y capturas. |
| `cypress/e2e/api/fake-store.cy.js` | Escenarios API y flujo del carrito. |
| `cypress/e2e/ui/checkout.cy.js` | Compra de tres productos y confirmación. |
| `cypress/support/commands.js` | Solicitudes API comunes y preparación de sesión UI. |
| `cypress/support/api-assertions.js` | Validaciones reutilizables de estructura y datos. |
| `cypress/support/sauce-helpers.js` | Selectores, comparación de productos y cálculos monetarios. |
| `cypress/fixtures/checkout.json` | Datos ficticios del comprador. |
| `scripts/setup-api.cjs` | Generación de configuración local para la API. |
| `scripts/check-syntax.cjs` | Revisión de sintaxis del código. |
| `docs/REPORTE_DEFECTOS.md` | Análisis de la tabla y reporte formal de un defecto. |
| `docs/GUIA_DEFENSA.md` | Material de estudio sobre el código y sus decisiones. |
| `docs/VALIDACION.md` | Resultados de ejecución y limitaciones. |

## Cobertura API

- Login válido: HTTP 201, respuesta JSON y token de tipo string no vacío.
- Login inválido: HTTP 401 y mensaje de credenciales incorrectas.
- Catálogo: HTTP 200, al menos cuatro productos, IDs únicos y validación de campos y tipos.
- Creación: HTTP 201 y carrito con tres productos existentes obtenidos del catálogo.
- Actualización: HTTP 200, reutilización del ID devuelto por POST y agregado de un cuarto producto.
- Eliminación: HTTP 200, reutilización del mismo ID y validación de la respuesta.

Se comprueban el esquema del carrito, el usuario, la fecha y los productos con sus cantidades en las respuestas de creación y actualización.

El flujo de creación, actualización y eliminación se encuentra en un único `it`, porque sus pasos dependen del carrito creado durante ese escenario. Los dos escenarios de login son independientes.

El token se guarda en memoria y se reutiliza mediante el header `Authorization: Bearer ...`. Como los endpoints son públicos, enviar este header no demuestra por sí mismo que el servicio compruebe permisos. La suite no cubre rechazo de tokens inválidos.

### Limitación de las escrituras simuladas

Fake Store es un servicio de demostración con escrituras simuladas. Crear un carrito puede devolver un ID sin persistir el recurso.

Por este motivo, DELETE sobre el ID creado puede devolver JSON `null`. El test contempla esa respuesta y conserva el ID original. Si devuelve un carrito, se valida su estructura, ID y usuario.

La suite verifica las solicitudes y respuestas del flujo, pero no demuestra un CRUD persistente completo ni una eliminación real en una base de datos. No se sustituye el ID por el de un carrito preexistente ni se interceptan las respuestas para forzar el resultado.

## Cobertura UI

El escenario comienza con una sesión preparada de `standard_user` mediante la cookie `session-username` de Sauce Demo. El login queda fuera del alcance de esta prueba.

Se verifica:

- Selección de tres productos y captura de nombres, descripciones y precios.
- Agregado al carrito y contador de tres productos.
- Carrito con tres filas y cantidades individuales de uno.
- Consistencia de nombres, descripciones y precios.
- Ingreso de datos obligatorios de checkout desde una fixture.
- Resumen con los mismos productos.
- Subtotal calculado a partir de los precios.
- Impuesto no negativo y total igual a subtotal más impuesto.
- Información de envío y pago visible y no vacía.
- Confirmación de compra y ausencia del contador del carrito.

La preparación de sesión carga la aplicación desde la raíz y establece la ruta de inventario antes de su inicio, evitando el HTTP 404 observado al navegar directamente a `/inventory.html`.

Los precios se comparan entre catálogo, carrito y checkout. No se comprueba su exactitud frente a una fuente comercial externa. Tampoco se supone una tasa impositiva que la consigna no define.

## Decisiones de implementación

- Lectura de credenciales con `cy.env()` y URL pública con `Cypress.expose()`.
- Selectores basados en atributos `data-test`.
- Helpers y comandos reutilizables para reducir duplicación.
- Productos de API seleccionados desde el catálogo y ordenados por ID.
- Cálculos monetarios en centavos enteros para evitar diferencias de punto flotante.
- Esperas mediante condiciones concretas, sin pausas fijas como `cy.wait(5000)`.
- Solicitudes sensibles con `log: false` y validaciones que evitan imprimir el token.
- Capturas habilitadas ante fallos.
- Dependencias fijadas mediante `package-lock.json` e instalación con `npm ci`.

Los códigos HTTP se validan de forma exacta. Durante la ejecución se corrigieron las expectativas de login válido y creación del carrito a HTTP 201, manteniendo las validaciones del contenido de las respuestas.

## Resultados de validación

Las pruebas funcionales se ejecutaron en Windows el 07/10/2026 con Node.js 24.21.0 y Cypress 16.1.1, utilizando Electron en modo headless.

| Suite | Aprobadas | Fallidas |
| --- | --- | --- |
| UI | 1 | 0 |
| API | 3 | 0 |

Consultar `docs/VALIDACION.md` para ver los ajustes realizados y las limitaciones del servicio.

Estos resultados corresponden a la ejecución registrada. La disponibilidad y el comportamiento de los servicios externos pueden cambiar.

## Referencias

- Consigna del challenge técnico QA suministrada para el ejercicio.
- Fake Store API: https://fakestoreapi.com/docs
- Cypress, lectura de variables: https://docs.cypress.io/api/commands/env
- Cypress, variables de entorno: https://docs.cypress.io/app/guides/environment-variables
- Sauce Demo: https://www.saucedemo.com

Durante la preparación, el acceso a la documentación de Fake Store estuvo bloqueado por un desafío de Cloudflare HTTP 403. No se presenta esa documentación como íntegramente consultada ni se utilizó el repositorio GitHub de Fake Store como sustituto. Las pruebas API se ejecutaron posteriormente desde Windows con acceso al servicio.

## Entrega

El repositorio es público e incluye código, configuración de ejemplo, dependencias fijadas, instrucciones de ejecución y reporte de defectos.

Se excluyen mediante `.gitignore`:

- `node_modules`
- `cypress.env.json`
- Capturas y videos generados por Cypress
- Archivos de logs

La guía de defensa incluida en `docs/GUIA_DEFENSA.md` explica la estructura, los escenarios y las decisiones del proyecto.