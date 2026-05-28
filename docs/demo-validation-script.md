# Guion de demo — Vertia Legal

## Objetivo de la reunión (30–45 min)

Validar si el estudio percibe valor en: centralización documental, búsqueda contractual, control de vencimientos y auditoría asistida.

## Apertura (3 min)

> "Hoy los estudios suelen mezclar Drive, carpetas por cliente, Excel de vencimientos y búsqueda manual en PDF. Vertia centraliza expedientes, indexa el texto, alerta vencimientos y permite auditar riesgos bajo demanda, sin enviar todo a IA en cada carga."

## Caso 1 — Encontrar una cláusula (8 min)

1. Mostrar panel ejecutivo: portfolio, vencimientos, riesgo.
2. Búsqueda híbrida: palabra clave + filtro por cliente o tipo documental.
3. Abrir resultado, resaltar fragmento y semáforo de riesgo.
4. Consulta jurídica asistida sobre el fragmento seleccionado.

**Pregunta:** ¿Cuánto les lleva hoy encontrar una cláusula similar?

## Caso 2 — No perder un vencimiento (8 min)

1. Vista Cliente 360: contratos, obligaciones y alertas del cliente.
2. Mostrar obligación pendiente con responsable asignado.
3. Sidebar de alertas: 30/60/90 días.
4. Editar metadatos / renovación automática en un contrato.

**Pregunta:** ¿Quién es responsable hoy de que no se pierda un plazo?

## Caso 3 — Informe para el cliente (7 min)

1. Ejecutar auditoría cognitiva (si el documento está indexado).
2. Exportar informe de auditoría (Markdown / HTML imprimible).
3. Exportar búsqueda a CSV o informe de portfolio del cliente.

**Pregunta:** ¿Qué informe entregan hoy al cliente y en cuánto tiempo lo arman?

## Cierre comercial (5 min)

- Ofrecer piloto controlado con 20–50 documentos reales.
- Pedir permiso para segunda reunión con socio/contador responsable.
- Registrar objeciones: precio, seguridad, multiusuario, integración.

## Preguntas de descubrimiento

1. ¿Dónde guardan contratos, actas, poderes y vencimientos hoy?
2. ¿Cómo se enteran de renovaciones y plazos fiscales/societarios?
3. ¿Cuántas personas acceden a la misma carpeta de un cliente?
4. ¿Necesitan separar lo que ve un abogado vs. un contador?
5. ¿Qué documento pierden más tiempo buscando?
6. ¿Usan plantillas de contratos o todo es ad hoc?
7. ¿Qué pasaría si mañana se vence un contrato clave sin aviso?
8. ¿Pagarían por alertas + búsqueda + informes, o solo por uno de esos?
9. ¿Cuánto pagarían por mes por un estudio de X personas? (rango)
10. ¿Qué les haría cambiar de Excel/Drive a una herramienta dedicada?

## Señales de interés real

- Piden cargar documentos propios en la reunión.
- Preguntan por permisos, usuarios o confidencialidad.
- Mencionan un cliente o caso concreto donde les duele.
- Piden precio o plazo de implementación.

## Objeciones frecuentes y respuesta breve

| Objeción | Respuesta |
|----------|-----------|
| "Ya tenemos Drive" | Drive guarda; Vertia indexa, busca, alerta y audita sin reemplazar todo el flujo de golpe. |
| "No confiamos en IA" | La IA es bajo demanda; el hash y el texto quedan en su Supabase; no entrenamos modelos con sus PDFs. |
| "Es caro" | Comparar con horas de búsqueda manual y un vencimiento perdido. |
| "Falta firma electrónica" | No competimos con DocuSign; somos control documental y vencimientos primero. |

## Criterio post-demo

Marcar cada reunión:

- **A** — Quiere piloto con documentos reales.
- **B** — Interesado, necesita segunda reunión.
- **C** — Curiosidad, sin dolor claro.
- **D** — No es prioridad.

## Checklist pre-demo

- [ ] Migraciones 006–009 aplicadas en Supabase.
- [ ] Al menos 2 clientes de ejemplo con contratos y vencimientos.
- [ ] Un contrato auditado con informe exportable.
- [ ] `GROQ_MODEL` configurado y cuota disponible.
- [ ] Navegador en pantalla completa, sin pestañas distractores.
