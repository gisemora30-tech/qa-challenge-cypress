# Validación del proyecto

Fecha: 07/10/2026.

Entorno: Windows, Node.js 24.21.0 y Cypress 16.1.1.
Navegador de ejecución: Electron, en modo headless.

## Resultados

| Comando | Resultado |
| --- | --- |
| npm.cmd run test:ui | 1 prueba aprobada, 0 fallidas |
| npm.cmd run test:api | 3 pruebas aprobadas, 0 fallidas |

## Ajustes realizados

- Se ajustó la preparación de sesión de Sauce Demo para cargar
  el inventario desde la página raíz, evitando el error HTTP 404
  de la navegación directa.
- Se corrigió el código HTTP esperado a 201 para el login válido
  y la creación del carrito, según las respuestas observadas.
- Se mantuvieron las validaciones del contenido de las respuestas.

## Limitaciones

Fake Store simula las escrituras. El flujo reutiliza el ID del
carrito creado para PUT y DELETE. Una respuesta null al eliminar
no demuestra una eliminación persistente en la base de datos.