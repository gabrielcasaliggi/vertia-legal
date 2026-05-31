# Autenticación — Vertia Legal

## Requisitos en Supabase

1. Aplicar las migraciones de auth y SaaS (`010_auth_profiles.sql`, `014_multi_tenant.sql`, `015_tenant_rls_hardening.sql`, `017_platform_admins_and_org_lifecycle.sql`) en el SQL Editor o con la CLI.
2. En **Authentication → Providers**, mantener habilitado **Email** (contraseña).
3. Desactivar registro público si no querés altas espontáneas: **Authentication → Settings → Enable email signups** (recomendado: off en piloto).

## Crear el primer administrador

```bash
npm run create-admin -- admin@tuestudio.com TuClaveSegura "María López"
```

El script usa la service role y crea el perfil con rol `admin` vía trigger.

Ese usuario será administrador del estudio activo, no necesariamente administrador de plataforma.

## Crear un usuario Vertia de plataforma

Para poder crear organizaciones nuevas desde **Plataforma SaaS**, el usuario debe existir en Supabase Auth y además estar registrado en `public.platform_admins`.

1. Crear o ubicar el usuario en **Supabase → Authentication → Users**.
2. Copiar el **User UID**.
3. Ejecutar:

```sql
insert into public.platform_admins (user_id)
values ('PEGAR_USER_UID')
on conflict (user_id) do update set is_active = true;
```

Luego cerrar sesión y volver a ingresar. El menú debe mostrar **Plataforma SaaS** y la ruta disponible será:

```text
/platform/organizaciones
```

El platform admin representa un usuario interno de Vertia. No es lo mismo que `profiles.role = 'admin'`, que representa al administrador de un estudio cliente.

## Flujo en la app

- Rutas protegidas por `middleware.ts` (redirección a `/login` sin sesión).
- Sesión en cookies con `@supabase/ssr`.
- Perfiles en `public.profiles` con roles: `admin`, `lawyer`, `accountant`, `assistant`.
- Superusuarios Vertia en `public.platform_admins`.
- Organización activa en cookie segura `vertia_active_org`.
- La bitácora registra el nombre del usuario autenticado automáticamente.

## Roles de estudio

| Rol | Uso |
|-----|-----|
| `admin` | Owner/admin del estudio activo. Gestiona usuarios y configuración de su organización |
| `lawyer` | Abogados del estudio |
| `accountant` | Contadores / fiscal |
| `assistant` | Asistentes y carga documental |

Los roles de estudio operan siempre dentro de la organización activa. Un admin de estudio no puede crear organizaciones SaaS ni cambiar planes/estados comerciales.

## Roles de plataforma

| Tipo | Dónde vive | Uso |
|------|------------|-----|
| Platform admin | `public.platform_admins` | Usuario Vertia que crea organizaciones, owners, planes y estados |
| Admin de estudio | `public.profiles.role = 'admin'` + `organization_members` | Administra su propio estudio |

Esta separación evita mezclar permisos comerciales de Vertia con permisos operativos del cliente.
