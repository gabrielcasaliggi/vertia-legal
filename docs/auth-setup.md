# Autenticación — Vertia Legal

## Requisitos en Supabase

1. Aplicar la migración `supabase/migrations/010_auth_profiles.sql` en el SQL Editor o con la CLI.
2. En **Authentication → Providers**, mantener habilitado **Email** (contraseña).
3. Desactivar registro público si no querés altas espontáneas: **Authentication → Settings → Enable email signups** (recomendado: off en piloto).

## Crear el primer administrador

```bash
npm run create-admin -- admin@tuestudio.com TuClaveSegura "María López"
```

El script usa la service role y crea el perfil con rol `admin` vía trigger.

## Flujo en la app

- Rutas protegidas por `middleware.ts` (redirección a `/login` sin sesión).
- Sesión en cookies con `@supabase/ssr`.
- Perfiles en `public.profiles` con roles: `admin`, `lawyer`, `accountant`, `assistant`.
- La bitácora registra el nombre del usuario autenticado automáticamente.

## Roles (piloto)

| Rol | Uso |
|-----|-----|
| `admin` | Gestión de usuarios y configuración futura |
| `lawyer` | Abogados del estudio |
| `accountant` | Contadores / fiscal |
| `assistant` | Asistentes y carga documental |

En esta fase todos los roles autenticados acceden al mismo repositorio (estudio único). El rol se muestra en la barra superior y prepara permisos granulares posteriores.
