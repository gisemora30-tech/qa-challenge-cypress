# Guía para entender y defender el proyecto

Esta guía explica la implementación preparada. Usala como material de estudio, y completá la evidencia de ejecución real antes de decir que el proyecto pasó.

## 1. Qué hace el proyecto

Hay dos formas de comprobar el sistema:

- API: Cypress envía requests directamente a Fake Store, sin abrir una pantalla de tienda. Comprueba login y el flujo de carrito.
- UI: Cypress abre Sauce Demo y realiza la compra como lo haría una persona, comenzando con el estado de sesión ya preparado.

El tercer punto no es una automatización: es una revisión estática de una tabla y el reporte de sus defectos.

Una explicación inicial posible, ajustada a lo que hayas ejecutado:

> Organicé el proyecto con Cypress y JavaScript, separando API y UI. Para la API validé estados HTTP, estructuras, tipos y contenido, usando productos obtenidos del servicio. Para UI preparé la sesión de standard_user y comparé catálogo, carrito y checkout. Documenté las limitaciones del servicio de demostración y los resultados reales de ejecución.

Si todavía no ejecutaste alguna parte, decí “preparé las validaciones” en lugar de “validé”.

## 2. Qué instalamos y para qué

| Concepto | Significado en este proyecto |
|---|---|
| Node.js | Permite ejecutar JavaScript fuera del navegador; npm y la herramienta Cypress dependen de él. |
| npm | Administra paquetes y ejecuta los comandos definidos en `package.json`. |
| Cypress | Herramienta que ejecuta pruebas de navegador y requests HTTP. |
| JavaScript | Lenguaje en el que están escritos los tests y la configuración. |
| VS Code | Editor para leer y modificar archivos; no reemplaza a Node ni Cypress. |
| Git | Guarda historial de cambios. |
| GitHub | Aloja el repositorio que pide la entrega. |

`npm ci` instala las versiones exactas del lockfile. `npm install` se usa cuando se agregan o actualizan dependencias. `--save-dev` significa que el paquete se utiliza para desarrollar/verificar el proyecto.

`node_modules` contiene dependencias descargadas; no se sube. `package-lock.json` conserva las versiones que sí deben poder reproducirse.

## 3. Orden para estudiar los archivos

1. `package.json`: cómo se ejecuta.
2. `cypress.config.js`: dónde y con qué condiciones se ejecuta.
3. `commands.js`: operaciones compartidas.
4. `api-assertions.js`: qué significa validar una respuesta.
5. `fake-store.cy.js`: flujo de API.
6. `checkout.json`, `sauce-helpers.js` y `checkout.cy.js`: flujo UI.
7. `REPORTE_DEFECTOS.md`: criterio para informar errores.

En VS Code podés abrir un archivo Markdown y usar **Ctrl + Shift + V** para verlo con formato.

## 4. Sintaxis mínima de JavaScript y Cypress

| Expresión | Explicación |
|---|---|
| `const` | Declara una referencia que no se reasigna. Un array declarado con const sí puede recibir elementos. |
| `let` | Declara una variable que se va a reasignar, como el ID devuelto al crear el carrito. |
| `{ ... }` | Objeto: agrupa campos con nombre, como usuario, fecha y productos. |
| `[ ... ]` | Array: lista ordenada de elementos. |
| `=>` | Función flecha: bloque de trabajo que se ejecuta cuando corresponde. |
| `import` | Trae funciones exportadas por otro archivo. |
| `export` | Permite que otros archivos usen una función. |
| `describe` | Agrupa escenarios bajo un nombre. |
| `it` | Define un caso de prueba. |
| `beforeEach` | Prepara el estado antes de cada caso del grupo. |
| `expect` | Assertion: compara un valor real con una condición esperada. |
| `.should()` | Assertion de Cypress que se reintenta cuando la cadena lo permite. |
| `.then()` | Procesa el resultado de una operación anterior. Su callback no se reintenta como una assertion de DOM. |
| `cy.then()` | Agrega un bloque a la cola de Cypress para ejecutarlo en el momento correcto. |
| `.map()` | Transforma cada elemento de una lista y devuelve una lista nueva. |
| `.slice(0, 3)` | Toma los primeros tres elementos sin modificar la lista original. |
| `.forEach()` | Ejecuta una operación por cada elemento. |
| `...array` | Copia/expande elementos; permite conservar los tres productos y sumar el cuarto. |
| `.reduce()` | Acumula valores, por ejemplo la suma de precios. |
| `.as('buyer')` | Guarda un alias accesible luego con `cy.get('@buyer')`. |

### La cola de Cypress

Los comandos `cy.*` se encolan y se ejecutan después, en orden. No podés asumir que el ID ya existe justo después de escribir `cy.request()`.

Por eso la URL de actualización se construye dentro de `cy.then()`: en ese momento POST ya terminó y `cartId` contiene el ID real recibido. Si construyéramos la URL antes, podríamos enviar `/carts/undefined`.

## 5. Configuración

`require('cypress')` importa `defineConfig`; `module.exports` entrega el objeto de configuración a Cypress.

- `baseUrl`: dirección de Sauce Demo; permite escribir `cy.visit('/cart.html')` con rutas relativas.
- `specPattern`: patrón para localizar archivos de prueba `.cy.js`.
- `supportFile`: archivo que registra commands antes de ejecutar los tests.
- `expose.apiUrl`: dirección pública de la API. No es una contraseña.
- `cy.env()`: lee únicamente las variables solicitadas, como password. En Cypress 16 reemplaza el acceso antiguo `Cypress.env()`.
- `viewportWidth/Height`: tamaño del navegador para una ejecución consistente.
- `defaultCommandTimeout`: tiempo máximo de espera de comandos como buscar un elemento. No es una pausa fija.
- `responseTimeout`: tiempo máximo para esperar respuesta de request.
- `retries: 0`: evita repetir un escenario de escrituras de forma automática.
- `screenshotOnRunFailure`: guarda evidencia cuando falla un test ejecutado en modo run.

## 6. Commands: cuándo aportan valor

`apiRequest` centraliza URL, opción de revisar errores HTTP y desactivación de logs sensibles. Así no se copia esa configuración en cada request.

`failOnStatusCode: false` no convierte un 401 en aprobado. Permite recibir la respuesta para compararla con el estado esperado. En el login negativo queremos 401; en una creación esperamos 200 y otro estado falla.

`prepareSauceSession` abre el origen, configura la cookie `session-username` con `standard_user` y entra al inventario. No hace clic en Login ni prueba credenciales. La cookie se eligió por el mecanismo de sesión de esta aplicación de demostración; no es una solución genérica para sitios reales.

`cy.location('pathname')` y la visibilidad del catálogo verifican que la precondición quedó lista. Si cambia el mecanismo de sesión, la preparación falla antes de la compra y habría que actualizarla.

## 7. API paso a paso

### Credenciales y token

`readCredentials()` obtiene usuario, password e ID del archivo local o entorno. No están escritos dentro del test.

`login()` hace POST `/auth/login` con un body que contiene usuario y password. Valida 200, JSON y token string no vacío. Retorna el token obtenido.

El token se guarda en una variable en memoria dentro del escenario CRUD y se incorpora como `Authorization: Bearer ...` a los requests posteriores. No se escribe a un archivo ni se inventa un token fijo.

**Límite:** mandar un header no demuestra que el servicio controle permisos. Los endpoints públicos pueden ignorarlo. Para demostrar autorización harían falta endpoints protegidos y casos con token ausente/inválido.

### Escenario negativo

Se usa el mismo usuario con un password modificado durante la ejecución. Se espera 401 y el mensaje de credenciales inválidas. Un 403 por Cloudflare no es el resultado esperado del login negativo: corresponde a un bloqueo anterior al comportamiento que se intenta probar.

### GET de productos

HTTP GET consulta. La respuesta debe ser un array con al menos cuatro productos: tres para crear y otro para agregar.

Se revisan IDs enteros positivos, nombres/descripciones/categorías/imágenes strings y precios numéricos no negativos. También se revisa que no haya IDs duplicados.

Ordenamos los objetos por ID y tomamos los primeros cuatro. Esta selección es determinista, pero sus IDs se obtienen en vivo. No están definidos como `[1, 2, 3]` en el test.

### POST de carrito

HTTP POST envía un recurso nuevo. El body incluye `userId`, fecha del día y tres objetos `{ productId, quantity: 1 }`.

La respuesta se valida por capas:

1. Estado HTTP.
2. Tipo de contenido.
3. Campos y tipos del objeto.
4. Correspondencia del usuario, día y productos/cantidades enviados.

Se guarda `response.body.id` para el paso siguiente. No alcanza con que el request “no tire error”.

### PUT de carrito

HTTP PUT envía la representación actualizada. Se construye una lista nueva con los tres ítems originales y un cuarto ítem de cantidad 2.

La URL utiliza el ID creado. Las assertions comprueban el mismo ID, el esquema, la lista completa y la presencia del nuevo producto. Comparar toda la lista detecta si la actualización perdió los productos anteriores.

### DELETE de carrito y límite importante

HTTP DELETE solicita eliminar ese mismo ID. Se verifica el estado y la respuesta. Si retorna un carrito se valida su estructura y el ID; si retorna JSON `null`, se registra como respuesta de un ID no persistido, no como prueba de eliminación real.

No defendás esto diciendo “lo borré de la base”: el servicio es de demostración y la suite no demuestra persistencia. La consigna pide usar el carrito creado; por eso no se cambia silenciosamente a un ID existente.

Para una API real, agregaríamos GET posterior esperando 404 y limpieza controlada de datos, según contrato. Aquí no inventamos una garantía que no hemos confirmado.

### Por qué un solo caso CRUD

Crear, actualizar y eliminar dependen del mismo ID. Son pasos de un escenario. Separarlos en tres `it` dependientes impediría ejecutar cualquiera aisladamente. Los dos casos de login sí son independientes.

## 8. Helpers de API

- `expectHttp`: compara el código exacto esperado.
- `expectJson`: revisa Content-Type JSON.
- `expectPositiveInteger`: evita aceptar un string numérico, cero, negativos o decimales donde esperamos IDs/cantidades.
- `expectProduct`: valida los campos de un producto.
- `expectCart`: valida campos del carrito y los tipos de los productos contenidos.
- `expectCartMatches`: combina esquema y correspondencia con el body enviado.

`deep.eq` compara el contenido de objetos/listas, no solo si se trata de la misma referencia en memoria. No se exige que el objeto no tenga campos adicionales, para admitir metadatos sin debilitar los campos requeridos.

## 9. UI paso a paso

### Preparación y datos

`beforeEach` prepara sesión y carga el fixture del comprador. El fixture separa los datos del flujo; nombre, apellido y código postal no son assertions de identidad real, son datos de prueba.

### Selección

La prueba lee tres filas del catálogo y guarda nombre, precio y descripción. Obtiene también el `data-test` del botón de agregar correspondiente. Luego hace clic en cada botón.

El snapshot de catálogo se usa como referencia para comprobar consistencia posterior. Si el precio inicial estuviera mal en todas las pantallas, este test no detectaría ese error sin una fuente externa de precios esperados.

### Carrito

Se revisa badge `3`, ruta `/cart.html`, título, número de filas y cada nombre/precio/descripción/cantidad.

`assertItems()` encuentra el producto por nombre y limita la búsqueda a su fila con `.closest()` y `.within()`. Eso evita comparar el precio de un producto con el de otro.

### Checkout

Se entra al formulario y se escriben los datos del fixture. `have.value` verifica lo que quedó efectivamente en cada campo.

En el resumen se vuelven a comprobar los ítems. Se suma el precio de cada producto en centavos. Se lee el impuesto y se comprueba que el total coincida con subtotal + impuesto.

No se fija una tasa fiscal que la consigna no especifica. Si hubiera una regla de negocio sobre tasa/redondeo, debería validarse también.

### Confirmación

Después de Finish, se revisan ruta final, título “Thank you for your order!”, texto del despacho y ausencia del badge. Solo llegar a una URL no alcanzaría: también comprobamos contenido visible.

## 10. Selectores, dinero y mantenibilidad

`[data-test="checkout"]` selecciona un atributo destinado a identificación de elementos. Tiene menor dependencia del aspecto visual que clases CSS o posiciones como “el tercer botón”. Puede cambiar si la aplicación cambia su contrato de selectores; estable no significa inmutable.

`moneyToCents('$29.99')` devuelve 2999. JavaScript usa números de punto flotante y operaciones como 0.1 + 0.2 pueden dar un decimal inesperado; los centavos enteros evitan esa diferencia en las sumas de este flujo.

No usamos Page Object Model por obligación. Con un solo flujo y helpers pequeños, una clase por pantalla agregaría estructura sin una reutilización clara. Si crecieran las suites, podríamos migrar interacciones comunes a objetos de página.

No hay esperas fijas. Las assertions esperan por el elemento o la condición y fallan al vencer el timeout. Esto permite avanzar rápido si la página responde rápido.

## 11. Reporte de defectos

Distinguir lo visible de la causa supuesta es parte del trabajo de QA:

- Vemos `Dep&oacute;sito`, pero no tenemos evidencia para asegurar qué capa lo codificó mal.
- Vemos un mes 21 bajo formato dd/mm/aaaa, pero no sabemos si está mal el valor almacenado o solo la presentación.
- Vemos un signo positivo en “Débito”, pero no podemos afirmar que se sumó dinero al saldo real.

El reporte elige el problema de fecha porque puede observarse directamente en el documento. No inventa navegador, versión, logs, Jira ni una reproducción sobre una aplicación inexistente.

## 12. Preguntas habituales de defensa

| Pregunta | Respuesta que podés desarrollar |
|---|---|
| ¿Por qué Cypress? | Es la herramienta pedida y cubre requests HTTP y UI en un mismo proyecto. |
| ¿Qué diferencia hay entre API y UI? | API comprueba respuestas del servicio; UI comprueba el flujo visible y la integración en el navegador. |
| ¿Por qué cy.env? | El password cambia por entorno y no debe estar en el test; además es la API actual para secretos en Cypress 16. |
| ¿Por qué el token no es fijo? | Se obtiene de login en cada escenario que lo necesita y se reutiliza durante esa ejecución. |
| ¿Cómo sabés que los productos existen? | Los selecciono de GET /products, luego de validar la respuesta. |
| ¿Cómo actualizás el mismo carrito? | Guardo el ID devuelto por POST y lo uso en PUT y DELETE. |
| ¿Por qué no tres tests CRUD separados? | Son pasos dependientes de un único escenario; evito dependencia entre tests. |
| ¿Por qué no probar login de UI? | Está explícitamente fuera del alcance; preparo la sesión como precondición. |
| ¿Qué significa que pase el test de DELETE? | Que la respuesta cumple las condiciones del servicio simulado, no que se haya borrado de una base persistente. |
| ¿Qué prueba la comparación de precios? | La consistencia del precio entre pantallas, no su corrección frente a una tarifa externa. |
| ¿Qué hacés ante 403 de Cloudflare? | Registro el impedimento; no lo acepto como login negativo ni reemplazo el servicio con respuestas falsas. |
| ¿Qué ejecutaste de verdad? | Debo responder con los resultados de VALIDACION.md y de mi terminal, sin confundir sintaxis con ejecución funcional. |
| ¿Qué mejorarías con más tiempo? | Más casos negativos y borde, validaciones de negocio definidas, automatización CI con secretos y mejor evidencia de ejecuciones. |

## 13. Repaso rápido antes de defender

Abrí el test API y explicá en voz alta: credenciales → token → productos → carrito/ID → actualización → solicitud de eliminación y límite de persistencia.

Abrí el test UI y explicá: sesión → catálogo → tres productos → carrito → formulario → resumen y total → confirmación.

Para cada assertion preguntate: “¿Qué bug detectaría si falla?”. Para cada helper: “¿Qué duplicación evita?”. Si no podés responder, revisá ese bloque antes de memorizar nombres técnicos.
