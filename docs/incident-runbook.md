# Runbook de incidentes — Vertia Legal

## Upload falla con HTML o 500

1. Verificar deployment Production = último commit en GitHub.
2. Revisar logs Vercel → Functions → `/api/contracts/upload`.
3. Probar `GET /api/health` y `GET /api/health/pdf`.
4. Confirmar PDF digital < 4 MB.
5. Revisar variables `SUPABASE_*` y bucket `contracts`.

## Sesión / login

1. Supabase Auth → Site URL y Redirect URLs con dominio productivo.
2. Cerrar sesión e ingresar de nuevo.
3. Si cuenta desactivada: admin reactiva en `/admin/usuarios`.

## Groq / IA

1. Verificar `GROQ_API_KEY` en Vercel.
2. Errores 429: cuota agotada; reintentar con consulta más corta.
3. Auditoría: documento debe tener texto indexado suficiente.

## Supabase

1. Dashboard → logs de API y Postgres.
2. Confirmar migraciones aplicadas.
3. Restaurar backup si corrupción de datos (solo admin Supabase).

## Cloudflare + dominio

1. CNAME a Vercel, DNS only al validar.
2. SSL Full (no Flexible).
3. Error 525: revisar validación de dominio en Vercel.

## Escalación

| Severidad | Acción |
|-----------|--------|
| P1 — sin acceso | Rollback deploy Vercel + revisar Supabase |
| P2 — upload/IA roto | Logs función + health checks |
| P3 — UX menor | Fix forward en `main` |
