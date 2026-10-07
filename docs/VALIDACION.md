# Estado de validación

Fecha: 07/10/2026. Este documento distingue código preparado de pruebas ejecutadas.

| Verificación | Resultado observado |
|---|---|
| Instalación del paquete npm Cypress 16.1.1 y lockfile | Completada sin el binario de escritorio en el entorno de preparación |
| `npm run check` | Aprobado: sintaxis JavaScript correcta |
| Atributos de UI y cookie de sesión | Revisados en el JavaScript servido por Sauce Demo |
| Ejecución `npm run test:ui` | No ejecutó el test: falta el binario de Cypress |
| Descarga del ejecutable de Cypress | Falló: archivo recibido no se pudo descomprimir como ZIP |
| Acceso a Fake Store y documentación | HTTP 403, desafío de Cloudflare en este entorno |
| Suite API contra servicio real | Pendiente; contratos esperados no confirmados en vivo |
| Suite UI mediante Cypress | Pendiente en notebook de la postulante |
| Reporte de defectos | Revisión estática del ejemplo de la consigna |

## Verificación antes de entregar

Desde la raíz del proyecto, con Node 24 y Cypress instalado:

```powershell
npm.cmd ci
npm.cmd run setup:api
npm.cmd run test:ui
npm.cmd run test:api
```

Actualizar la siguiente tabla con los resultados reales. No marcar como aprobado un test que no se ejecutó.

| Suite | Fecha/hora | Pasaron | Fallaron | Observación |
|---|---|---|---|---|
| UI | Pendiente | — | — | — |
| API | Pendiente | — | — | — |

Si el servicio devuelve 403 o un cuerpo HTML, conservar el error como impedimento. No reemplazar las llamadas por fixtures ni cambiar los códigos esperados para simular una aprobación. Si un contrato esperado difiere de la respuesta real, revisar documentación y registrar el ajuste con su evidencia.
