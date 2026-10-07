# Challenge QA Automation — Gisela Mora

Pruebas en JavaScript con Cypress para Fake Store API y Sauce Demo. Incluye el análisis y reporte de defectos de la tabla de movimientos.

## Requisitos e instalación

- Node.js 24 LTS y npm. Cypress está fijado en la versión 16.1.1.
- Acceso a Internet a los dos servicios de demostración.
- Desde la carpeta donde está `package.json`:

```powershell
npm.cmd ci
```

En Windows se usa `npm.cmd` para evitar que PowerShell intente ejecutar `npm.ps1` si está bloqueado por la política de scripts. No es necesario modificar esa política. En Linux/macOS usar `npm`.

No hace falta ejecutar `npm start`: este proyecto no levanta una aplicación propia, prueba servicios ya publicados.

## Configuración de API

Opción automática, específica de los datos públicos de Fake Store:

```powershell
npm.cmd run setup:api
```

Obtiene un usuario del endpoint público `/users`, valida la respuesta y crea `cypress.env.json` localmente. No imprime el password. Si el archivo ya existe no lo sobrescribe. Este mecanismo no es apropiado para credenciales de producción.

Opción manual:

1. Copiar `cypress.env.example.json` como `cypress.env.json`.
2. Configurar `apiUsername`, `apiPassword` y `apiUserId` con un usuario válido del servicio. El ID debe ser numérico y corresponder a ese usuario.
3. No subir `cypress.env.json` a GitHub: está excluido en `.gitignore`.

También se pueden inyectar `CYPRESS_apiUsername`, `CYPRESS_apiPassword` y `CYPRESS_apiUserId` desde el entorno. El token no se configura manualmente: lo obtiene el test y lo conserva en memoria.

La UI no requiere password: el comando de preparación configura la cookie de sesión de `standard_user`, propia de Sauce Demo. El login no es un caso bajo prueba.

## Ejecución mediante scripts de npm

```powershell
npm.cmd run check
npm.cmd run test:ui
npm.cmd run test:api
npm.cmd test
npm.cmd run cy:open
```

| Script | Función |
|---|---|
| `check` | Revisa sintaxis; no reemplaza la ejecución funcional. |
| `setup:api` | Genera configuración local desde usuarios públicos de la API. |
| `test:ui` | Ejecuta únicamente la compra en Sauce Demo. |
| `test:api` | Ejecuta login positivo, negativo y flujo de carrito. |
| `test` | Ejecuta ambas suites. |
| `cy:open` | Abre Cypress para ver los pasos de ejecución. |

Para observar la ejecución UI en Chrome:

```powershell
npm.cmd run test:ui -- --browser chrome --headed
```

La ejecución sin `--browser` usa el navegador por defecto de Cypress. Si Chrome no funciona, el comando por defecto permite diagnosticar por separado.

## Organización

| Archivo/carpeta | Responsabilidad |
|---|---|
| `cypress.config.js` | URLs, ubicación de tests, viewport, timeouts y capturas. |
| `cypress/e2e/api/fake-store.cy.js` | Escenarios API y encadenamiento del carrito. |
| `cypress/e2e/ui/checkout.cy.js` | Compra de tres productos y confirmación. |
| `cypress/support/commands.js` | Request API común y estado previo de sesión UI. |
| `cypress/support/api-assertions.js` | Validadores reutilizables de estructura y datos. |
| `cypress/support/sauce-helpers.js` | Selectores, comparación de ítems y operaciones monetarias. |
| `cypress/fixtures/checkout.json` | Datos ficticios del comprador. |
| `docs/REPORTE_DEFECTOS.md` | Hallazgos del ejercicio y reporte formal de un defecto. |
| `docs/GUIA_DEFENSA.md` | Explicación del código, decisiones y preguntas de defensa. |
| `docs/VALIDACION.md` | Estado real de las verificaciones y pendientes. |

## Cobertura API

- Login válido: HTTP 200, respuesta JSON, token string no vacío.
- Login inválido: HTTP 401 y mensaje textual de credenciales incorrectas.
- Catálogo: HTTP 200, array con al menos cuatro productos, IDs únicos, campos y tipos.
- Creación: tres productos obtenidos del catálogo, HTTP 200, esquema del carrito, usuario, día y productos/cantidades.
- Actualización: usa el ID devuelto por POST, agrega un cuarto producto, conserva los tres originales y valida HTTP 200 y respuesta.
- Eliminación: usa el mismo ID, valida HTTP 200 y el cuerpo retornado, con la limitación descrita debajo.

El escenario CRUD completo vive en un solo `it`: es un único flujo dependiente. Los escenarios de login son independientes. No hay tests que dependan de ejecutarse después de otro `it`.

El token se reutiliza mediante `Authorization: Bearer ...` en las llamadas posteriores. Los endpoints públicos de Fake Store no permiten demostrar autorización por el solo hecho de enviar ese header. Esta suite no afirma verificar permisos ni rechazo de tokens inválidos.

### Limitación del CRUD simulado

Fake Store es un servicio de demostración. La suite contempla respuestas de escrituras simuladas; un POST puede devolver un ID sin crear un recurso persistente. En ese caso, DELETE sobre ese mismo ID puede devolver JSON `null`. La rama `null` valida la respuesta sin fingir que se eliminó un recurso de la base.

Si DELETE devuelve un carrito, se valida su esquema y el ID. No se cambia el ID por uno preexistente para forzar una respuesta ni se interceptan las respuestas de API. No se comprueba ausencia mediante GET después de DELETE, porque eso sería una comprobación de persistencia que el servicio simulado puede no soportar.

Esto significa que el test cubre los requests y las respuestas del flujo, pero **no prueba un CRUD persistente completo**. Debe informarse esta diferencia en la entrega. Si se exige estrictamente un recurso persistido y una respuesta objeto en DELETE, hace falta una aclaración del alcance o una API con persistencia; no corresponde ocultar esta limitación aceptando resultados como prueba de eliminación real.

Los estados y contratos esperados deben confirmarse con la ejecución del servicio actual. Si devuelve otro estado, el test falla y debe investigarse; no se amplían los códigos aceptados solo para obtener una ejecución verde.

## Cobertura UI

- Estado previo de `standard_user` mediante cookie `session-username`.
- Captura de nombres, descripciones y precios de tres ítems del catálogo.
- Agregado de los tres ítems y badge `3`.
- Carrito: tres filas, nombres, descripciones, precios y cantidad individual `1`.
- Checkout: datos requeridos desde fixture y comprobación de los valores ingresados.
- Resumen: mismos ítems, subtotal calculado, impuesto no negativo y total = subtotal + impuesto.
- Información de envío y pago visible y no vacía.
- Confirmación final y carrito vacío.

La comparación de precios verifica consistencia entre catálogo, carrito y checkout; no valida que el precio inicial del catálogo sea correcto según una regla de negocio externa. La tasa del impuesto tampoco tiene un requerimiento definido en la consigna: se comprueba consistencia del total, no una tasa inventada.

## Decisiones

- Cypress 16 usa `cy.env()` para leer credenciales y `Cypress.expose()` para URL pública; no se usa `Cypress.env()` retirado en esa versión.
- `data-test` permite selectores independientes del diseño visual.
- Helpers y commands pequeños reducen duplicación sin agregar un Page Object Model innecesario para un único flujo.
- Los productos de API vienen de la respuesta, ordenados por ID para una selección repetible.
- Los importes UI se calculan en centavos enteros para evitar diferencias de punto flotante.
- No hay `cy.wait(5000)` ni errores ignorados globalmente. Se espera por condiciones concretas.
- Requests sensibles tienen `log: false`; se evita mostrar password/token en assertions.
- Capturas de fallos habilitadas. No se incluye video ni dependencia de Cypress Cloud.
- Versiones reproducibles mediante `package-lock.json` y `npm ci`.

## Fuentes y comprobaciones

- Consigna: Challenge Técnico QA — DCAC suministrado para el ejercicio.
- Documentación pública solicitada: https://fakestoreapi.com/docs . Desde el entorno de preparación devolvió un desafío de Cloudflare HTTP 403; por eso no se presenta como una documentación íntegramente consultada o un contrato verificado en vivo. No se usó el GitHub de Fake Store como sustituto.
- Cypress: https://docs.cypress.io/api/commands/env y https://docs.cypress.io/app/guides/environment-variables .
- Aplicación objetivo: https://www.saucedemo.com . Se verificó en el código servido por la aplicación la cookie y los atributos `data-test`; esto no equivale a ejecutar Cypress.

Ver `docs/VALIDACION.md` antes de informar resultados. La revisión de sintaxis está aprobada; las ejecuciones funcionales están pendientes en una máquina con el ejecutable de Cypress disponible y acceso a la API.

## Publicación en GitHub

Crear un repositorio **público** y subir el contenido de esta carpeta, incluyendo `.gitignore` y `package-lock.json`. No subir `node_modules`, `cypress.env.json` ni archivos que contengan tokens. La guía de defensa es material de estudio y puede excluirse del repositorio si se prefiere; README y reporte sí forman parte de la entrega.

Antes de publicar, ejecutar UI y API, revisar los resultados y actualizar `docs/VALIDACION.md` con lo observado. Si hay un bloqueo del servicio, documentarlo con fecha y error; no declarar que las pruebas pasaron.
