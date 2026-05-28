# Checklist de go-live para piloto — Vertia Legal

Este documento ordena los pasos mínimos para dejar Vertia Legal listo para un piloto controlado con un estudio jurídico, contable o área legal interna.

El objetivo del piloto no es demostrar todas las capacidades posibles de un CLM enterprise, sino validar que el flujo principal funciona con documentos reales:

```text
login -> cargar PDF -> indexar -> buscar -> controlar vencimientos -> asignar tareas -> auditar bajo demanda -> exportar informe
```

## 1. Alcance recomendado del piloto

Para una primera validación, mantener el alcance acotado:

- 1 estudio o equipo legal.
- 2 a 5 usuarios.
- 20 a 50 documentos reales.
- 2 a 4 semanas de uso operativo.
- Un responsable interno que valide resultados, tareas e informes.

Criterio de éxito: el equipo debe poder encontrar cláusulas, detectar vencimientos y producir informes con menos fricción que usando carpetas, Excel y lectura manual aislada.

## 2. Preparar Supabase

Aplicar las migraciones en orden:

```text
001_legal_contracts.sql
002_add_analyzed_status.sql
003_analysis_result_realtime.sql
004_processing_phase.sql
005_hybrid_clm.sql
006_contract_metadata.sql
007_contract_management.sql
008_contract_obligations.sql
009_validation_clm.sql
010_auth_profiles.sql
011_notification_digest.sql
```

Validar en Supabase:

- Existe el bucket privado `contracts`.
- Existe la tabla `legal_contracts`.
- Existen las tablas `studio_clients`, `matters`, `contract_tasks`, `contract_obligations`.
- Existe la tabla `profiles`.
- Existe la tabla `notification_digest_log`.
- RLS está habilitado según las migraciones.

## 3. Configurar variables de entorno

Variables mínimas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Variables para notificaciones por email:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
NOTIFICATION_DIGEST_TO=
NOTIFICATION_CRON_SECRET=
NOTIFICATION_EXPIRY_DAYS=30
NOTIFICATION_TASK_DAYS=7
NOTIFICATION_OBLIGATION_DAYS=14
```

Si no se configuran emails, el piloto puede funcionar igual. En ese caso se validan alertas y tareas dentro de la aplicación.

## 4. Crear el primer administrador

Crear usuario admin:

```bash
npm run create-admin -- admin@estudio.com ClaveSegura "Nombre Apellido"
```

Luego ingresar en:

```text
/login
```

Validar:

- El usuario puede iniciar sesión.
- La barra superior muestra nombre y rol.
- El botón `Salir` cierra sesión correctamente.

## 5. Decidir datos demo vs datos reales

Antes de iniciar el piloto, decidir una de estas opciones:

- Base limpia: recomendado para documentos reales.
- Base con seed demo: útil para demostraciones, no ideal para piloto.
- Proyecto Supabase separado: recomendado si se va a mostrar demo y operar piloto en paralelo.

Nota: los contratos demo pueden tener texto indexado sin PDF físico en Storage. Eso es normal para demo, pero no debe confundirse con un error del visor.

## 6. Prueba de carga documental

Con un PDF real:

1. Ir al Dashboard.
2. Completar cliente, carpeta, tipo y categoría documental.
3. Subir el PDF.
4. Verificar que queda indexado.
5. Abrir el detalle del contrato.

Validar:

- El contrato aparece en `/contracts`.
- El detalle muestra hash SHA-256.
- El visor PDF abre.
- El PDF se puede descargar.
- El texto aparece en búsquedas.
- La bitácora registra la carga.

Si falla el visor, revisar:

- Que el archivo exista en el bucket `contracts`.
- Que el contrato no sea un registro demo sin archivo.
- Que `/api/contracts/[id]/file?meta=1` devuelva `available: true`.

## 7. Prueba de búsqueda

Ejecutar búsquedas con documentos reales:

- Nombre de una cláusula.
- Nombre de una parte.
- Monto o moneda.
- Fecha o vencimiento.
- Palabras de riesgo como rescisión, penalidad, renovación, incumplimiento.

Validar:

- Los resultados son relevantes.
- Los filtros por cliente, carpeta, categoría y vencimiento funcionan.
- El usuario puede abrir el expediente desde el resultado.
- El CSV de búsqueda se puede exportar si corresponde.

## 8. Prueba de vencimientos y lifecycle

En al menos 3 contratos, cargar o corregir:

- Fecha de inicio.
- Fecha de vencimiento.
- Renovación automática.
- Días de preaviso.

Validar:

- El dashboard muestra alertas de vencimiento.
- El estado del contrato se interpreta correctamente.
- El panel de renovación permite ajustar datos.

## 9. Prueba de tareas

Crear tareas desde:

- Detalle de contrato.
- Cliente 360.
- Página `/tareas`.

Validar en `/tareas`:

- Filtro `Solo mis tareas`.
- Filtro por responsable.
- Filtro por estado.
- Filtro por prioridad.
- Filtro por vencidas, hoy, próximos 7 días y sin fecha.
- Acciones `Tomar`, `Completar` y `Cancelar`.

Nota: en esta fase el responsable es texto libre (`assignee_name`). Para una producción más madura conviene migrar a `assignee_user_id`.

## 10. Prueba de auditoría cognitiva

Elegir un contrato relevante y ejecutar auditoría desde el detalle.

Validar:

- La auditoría se ejecuta solo bajo demanda.
- El resultado devuelve score de riesgo.
- Se muestran cláusulas críticas o advertencias.
- El resumen ejecutivo tiene sentido profesional.
- La respuesta no reemplaza la revisión del abogado o contador.

Si Groq devuelve errores de límite o tamaño:

- Reducir el texto del contrato.
- Usar un modelo alternativo configurado.
- Reintentar fuera de ventanas de alto consumo.

## 11. Prueba de reportes

En `/reportes`, validar:

- Selección de cliente real.
- Export de portfolio en Markdown.
- Export de portfolio en HTML imprimible.
- Selección de contrato real.
- Export de auditoría en Markdown.
- Export de auditoría en HTML imprimible.
- Botón de impresión/guardar PDF del navegador.

Criterio mínimo: el HTML debe ser legible, imprimible y revisable antes de enviarse al cliente.

## 12. Prueba de notificaciones

Si SMTP está configurado:

1. Ir a `/reportes`.
2. Abrir `Alertas por email`.
3. Actualizar vista previa.
4. Enviar resumen del día.
5. Confirmar recepción.
6. Revisar bitácora.

Para cron diario:

```bash
curl -X POST "https://tu-dominio/api/notifications/digest" \
  -H "Authorization: Bearer TU_NOTIFICATION_CRON_SECRET"
```

Validar:

- No se duplica el envío el mismo día.
- `Reenviar (forzar)` funciona solo cuando se necesita.
- Los destinatarios son correctos.

## 13. Seguridad mínima antes de usar datos reales

Antes de cargar documentos sensibles:

- Desactivar registro público en Supabase Auth.
- Usar usuarios individuales, no cuentas compartidas.
- Revisar variables `.env.local`.
- Confirmar que el bucket `contracts` no sea público.
- No compartir `SUPABASE_SERVICE_ROLE_KEY`.
- Confirmar que la app está protegida por `/login`.
- No usar datos reales en entornos demo públicos.

## 14. Criterios de piloto listo

El piloto está listo cuando:

- Un admin puede iniciar sesión.
- Se cargó al menos un PDF real.
- El PDF se visualiza y descarga.
- La búsqueda encuentra texto del documento.
- Hay al menos una tarea creada y completada.
- Hay al menos un reporte exportado.
- La bitácora registra actividad.
- Si aplica, se envió un email de alerta.

## 15. Pendientes recomendados después del piloto

Si el piloto funciona, priorizar:

- `assignee_user_id` para tareas asignadas a usuarios reales.
- Panel de administración de usuarios.
- Permisos más finos por rol.
- Plantillas de reportes por estudio.
- PDF server-side nativo.
- Backups, monitoreo y CI.
- Separación multi-estudio si se quiere ofrecer como SaaS.
