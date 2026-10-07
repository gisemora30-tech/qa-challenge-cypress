# Reporte de defectos — Movimientos de cuenta

Postulante: Gisela Mora. Fecha de análisis: 07/10/2026.

Fuente: tabla del punto 3 de la consigna. La evidencia es estática: no se dispone de una aplicación ejecutable para reproducir estos hallazgos.

## Tabla con hallazgos resaltados

| Fecha | Descripción | Importe pesos | Importe dólares | Hallazgo |
|---|---|---|---|---|
| 21/11/2011 | Extracción | - 1000.00 | — | Utiliza punto decimal, diferente del depósito. |
| **12/21/2011** | **`Dep&oacute;sito`** (texto literal de la entidad) | — | + 1000,00 | Fecha incompatible con dd/mm/aaaa y entidad HTML visible. |
| 01/10/2011 | Débito por **transferensia** | **+ 500.00** | — | Error ortográfico y signo positivo en un débito. |

El texto defectuoso exacto de la segunda descripción es `Dep&oacute;sito`: debería mostrarse `Depósito`.

## Defectos detectados

1. **Formato inconsistente de fecha:** `12/21/2011` usa mes/día/año mientras `21/11/2011` obliga a interpretar día/mes/año. En formato dd/mm/aaaa, el mes 21 es inválido. Si el dato original está en mm/dd/aaaa, su representación local sería `21/12/2011`. Hay que confirmar el valor fuente antes de modificarlo; no se puede asegurar que el dato almacenado sea incorrecto.
2. **Entidad HTML sin decodificar:** `Dep&oacute;sito` muestra una codificación técnica al usuario. Resultado esperado: `Depósito`. El hallazgo confirma un problema de representación; la causa técnica requiere inspección.
3. **Error ortográfico:** `transferensia` debería ser `transferencia`.
4. **Signo incompatible con la descripción:** `Débito por transferencia` muestra `+ 500.00`. Si la tabla representa variación del saldo, un débito debería restar y mostrarse `- 500,00` según la convención local. Se debe confirmar esa regla con negocio. No hay evidencia suficiente para afirmar que el saldo real fue incrementado.
5. **Formato monetario inconsistente:** pesos usa `1000.00` / `500.00`, dólares usa `1000,00`. Los importes deben seguir una convención de presentación uniforme según la localización definida. No se exige separador de miles sin un requerimiento, pero sí coherencia decimal.

No se reporta el orden de las filas como defecto confirmado: no se especifica el criterio de ordenamiento. Tampoco se considera incorrecto que haya pesos y dólares en columnas separadas; puede ser una funcionalidad de la billetera.

## Campos recomendados al reportar un defecto

- ID, título y módulo.
- Fecha y persona que reporta.
- Entorno, versión/build, navegador/SO cuando corresponda.
- Precondiciones y datos de prueba.
- Pasos para reproducir.
- Resultado actual y resultado esperado.
- Evidencia.
- Severidad e impacto; prioridad sugerida.
- Frecuencia/reproducibilidad.
- Estado, responsable y vínculos a requerimiento/caso de prueba.

La severidad refleja el impacto; la prioridad expresa la urgencia de corrección. La prioridad final debe acordarse con el equipo.

## Reporte formal de un defecto

| Campo | Valor |
|---|---|
| ID | BUG-MOV-001 |
| Título | La fecha del depósito se presenta con mes inválido para el formato dd/mm/aaaa |
| Módulo | Billetera virtual — Consulta de movimientos |
| Reportado por | Gisela Mora |
| Fecha | 07/10/2026 |
| Entorno | Ejemplo estático del challenge; versión/build/navegador/SO no informados |
| Precondición | Disponer de la tabla de movimientos incluida en el punto 3 |
| Datos | Registro de depósito por + 1000,00 dólares, fecha mostrada 12/21/2011 |
| Resultado actual | Se muestra 12/21/2011 junto a registros con formato dd/mm/aaaa, como 21/11/2011 |
| Resultado esperado | Todas las fechas se muestran con un único formato válido. Si el formato es dd/mm/aaaa y el origen equivale al 21 de diciembre, mostrar 21/12/2011 |
| Severidad sugerida | Media: información temporal inconsistente o ambigua para consultar movimientos |
| Prioridad sugerida | Media, a confirmar según alcance e impacto en otras pantallas/exportaciones |
| Reproducibilidad | Visible en el ejemplo suministrado; reproducción en sistema pendiente |
| Evidencia | Fila del depósito del punto 3 del PDF del challenge |
| Estado | Detectado en revisión estática, pendiente de confirmación en aplicación |
| Responsable | Por asignar |
| Referencia | Challenge DCAC, punto 3, consulta de movimientos |

### Pasos de observación

1. Abrir el PDF del challenge.
2. Ir al punto 3, tabla de movimientos.
3. Comparar la fecha de extracción `21/11/2011` con la del depósito `12/21/2011`.
4. Verificar que, bajo el formato día/mes/año indicado por la extracción, la segunda fecha contendría un mes 21.

### Criterio de retest

En una aplicación disponible, verificar que la fecha del depósito coincida con la fecha fuente y que todas las filas se representen con el formato definido. Probar días mayores a 12 para detectar inversiones de día/mes; incluir exportaciones solo si pertenecen al alcance del módulo.
