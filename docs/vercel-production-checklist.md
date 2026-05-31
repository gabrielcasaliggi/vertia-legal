# Checklist de producción — Vercel + Supabase

## Antes del go-live

- [ ] Proyecto Supabase **productivo** separado del local
- [ ] Migraciones `001`–`017` aplicadas en orden
- [ ] Bucket `contracts` creado (privado)
- [ ] Usuario admin creado: `npm run create-admin`
- [ ] Si se usa SaaS multi-org: usuario Vertia insertado en `platform_admins`
- [ ] Repo conectado a Vercel, branch `main` en Production

## Variables en Vercel (Production)

| Variable | Obligatoria |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí |
| `GROQ_API_KEY` | Sí (IA) |
| `NEXT_PUBLIC_SITE_URL` | Sí (`https://tu-dominio`) |
| `GROQ_MODEL` | Recomendada |
| `GROQ_VISION_MODEL` | Opcional |
| SMTP_* | Solo si usás digest email |
| `ALLOW_SERVER_OCR` | No en Hobby (solo worker dedicado) |

## Supabase Auth

- **Site URL:** `https://tu-dominio`
- **Redirect URLs:** `https://tu-dominio/**`
- Registro público: **desactivado** en piloto

## Cloudflare (si aplica)

- CNAME `legal` → `cname.vercel-dns.com`
- Inicio: **DNS only** (nube gris)
- SSL/TLS: **Full** (no Flexible)
- Validar dominio en Vercel antes de proxy naranja

## Límites operativos (Vercel Hobby)

- PDF **digital** con texto copiable (escaneados quedan marcados como `insufficient_text`)
- Tamaño máximo **4 MB**
- OCR server-side **desactivado** por defecto
- Auditoría IA y upload: hasta **60 s** por función

## Health checks post-deploy

```bash
curl -s https://TU-DOMINIO/api/health | jq .
curl -s https://TU-DOMINIO/api/health/pdf | jq .
```

Esperado: `"ok": true` en ambos (health general puede ser 503 si falta Groq, pero Supabase debe estar OK).

## Flujo de prueba

1. Login
2. Cargar PDF digital < 4 MB
3. Búsqueda
4. Consulta asistida
5. Auditoría cognitiva (opcional)
6. Crear tarea

## Flujo SaaS multi-organización

Si el entorno se usa para varios estudios clientes:

1. Entrar con usuario Vertia autorizado.
2. Abrir `/platform/organizaciones`.
3. Crear una organización de prueba.
4. Crear owner inicial.
5. Entrar con el owner.
6. Verificar que solo ve **Mi estudio** y no **Plataforma SaaS**.
7. Cargar un PDF de prueba.
8. Repetir con otra organización y validar aislamiento.

## Recuperación

- **Deploy viejo:** verificar commit en Vercel = último en GitHub `main`
- **Upload HTML/500:** logs en Vercel → Functions → `/api/contracts/upload`
- **Sesión:** cerrar sesión, revisar Site URL en Supabase
- **Backups:** activar en Supabase → Database → Backups

Ver también: [incident-runbook.md](./incident-runbook.md)
