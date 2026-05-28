# Notificaciones por email — Vertia Legal

## Qué envía

Un **resumen operativo** con:

- Contratos por vencer (horizonte por defecto: 30 días)
- Tareas abiertas con fecha próxima o vencida (7 días)
- Obligaciones contractuales pendientes (14 días)

No se reenvía al mismo destinatario el mismo día salvo que uses **Reenviar (forzar)** o el cron con `?force=1`.

## Variables de entorno

Agregá en `.env.local`:

```env
# SMTP (cualquier proveedor: Gmail, Office 365, servidor propio)
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-usuario
SMTP_PASS=tu-clave
SMTP_FROM=vertia@tuestudio.com

# Destinatarios fijos (opcional, separados por coma)
NOTIFICATION_DIGEST_TO=socio@estudio.com,legal@estudio.com

# Secreto para cron externo (opcional)
NOTIFICATION_CRON_SECRET=una-clave-larga-aleatoria

# URL pública de la app (enlace en el mail)
NEXT_PUBLIC_SITE_URL=https://legal.tudominio.com

# Horizontes (opcional)
NOTIFICATION_EXPIRY_DAYS=30
NOTIFICATION_TASK_DAYS=7
NOTIFICATION_OBLIGATION_DAYS=14
```

Si no definís `NOTIFICATION_DIGEST_TO`, el resumen se envía a los **emails de todos los perfiles activos**.

## Migración

Aplicá `supabase/migrations/011_notification_digest.sql` para el registro anti-duplicados.

## Envío manual (admin)

En **Reportes → Alertas por email** (solo rol `admin`):

1. **Actualizar vista previa** — cuenta de ítems sin enviar
2. **Enviar resumen hoy** — envía si hay alertas y SMTP está OK
3. **Reenviar (forzar)** — ignora el límite de un envío por día

## Cron diario (ejemplo)

```bash
curl -X POST "https://legal.tudominio.com/api/notifications/digest" \
  -H "Authorization: Bearer TU_NOTIFICATION_CRON_SECRET"
```

Forzar reenvío:

```bash
curl -X POST "https://legal.tudominio.com/api/notifications/digest?force=1" \
  -H "Authorization: Bearer TU_NOTIFICATION_CRON_SECRET"
```

Programalo con `cron`, systemd timer o el scheduler de tu hosting.
