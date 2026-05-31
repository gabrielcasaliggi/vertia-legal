# Vertia Legal

Smart CLM SaaS multi-organización para estudios jurídicos, contables y equipos legales: indexación de PDFs, búsqueda, tareas, consulta asistida con IA bajo demanda y auditoría cognitiva.

## Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (PostgreSQL, Storage, Auth, RLS)
- Groq API (`llama-3.3-70b-versatile`)

## Requisitos

- Node.js 20+
- Proyecto Supabase con migraciones en `supabase/migrations`

## Configuración local

```bash
cp .env.example .env.local
# Completar variables en .env.local

npm install
npm run dev
```

Aplicar migraciones en Supabase (SQL Editor o CLI). Crear usuario admin:

```bash
npm run create-admin
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run create-admin` | Crear usuario administrador |
| `npm run seed:demo` | Datos demo (opcional) |

## Documentación

- `docs/indice-documentacion-proyecto.md`
- `docs/dossier-producto-vertia-legal.md`
- `docs/manual-usuario-vertia-legal.md`
- `docs/saas-multiorg-operacion.md`
- `docs/onboarding-nueva-organizacion.md`
- `docs/pilot-go-live-checklist.md`
- `docs/vercel-production-checklist.md`
- `docs/roadmap-producto-final.md`

## Modelo SaaS

- **Plataforma SaaS**: panel interno de Vertia para crear organizaciones, owners, planes y estados.
- **Mi estudio**: panel del owner/admin de cada organización cliente.
- **Organización activa**: scope operativo para documentos, clientes, tareas y reportes.

Para habilitar un usuario Vertia como platform admin:

```sql
insert into public.platform_admins (user_id)
values ('USER_UID_DE_AUTH_USERS')
on conflict (user_id) do update set is_active = true;
```

Luego ingresar a `/platform/organizaciones`.

## Seguridad

No commitear `.env.local` ni claves reales. Usar `.env.example` como plantilla.
