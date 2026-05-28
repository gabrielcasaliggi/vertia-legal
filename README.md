# Vertia Legal

Smart CLM para estudios jurídicos: indexación de PDFs, búsqueda, tareas, consulta asistida con IA bajo demanda y auditoría cognitiva.

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

- `docs/manual-usuario-vertia-legal.md`
- `docs/pilot-go-live-checklist.md`
- `docs/roadmap-producto-final.md`

## Seguridad

No commitear `.env.local` ni claves reales. Usar `.env.example` como plantilla.
