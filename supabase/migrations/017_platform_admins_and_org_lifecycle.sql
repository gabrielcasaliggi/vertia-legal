-- Plataforma SaaS: superusuarios Vertia y ciclo de vida de organizaciones

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = auth.uid() and is_active = true
  );
$$;

create policy "Platform admins read self"
  on public.platform_admins for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- Solo service role / migraciones insertan platform_admins inicialmente

alter table public.organizations
  add column if not exists status text not null default 'active',
  add column if not exists plan text not null default 'pilot',
  add column if not exists billing_email text,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists created_by_platform_admin_id uuid references auth.users (id) on delete set null;

alter table public.organizations
  drop constraint if exists organizations_status_check;

alter table public.organizations
  add constraint organizations_status_check
  check (status in ('trial', 'active', 'suspended', 'cancelled'));

alter table public.organizations
  drop constraint if exists organizations_plan_check;

alter table public.organizations
  add constraint organizations_plan_check
  check (plan in ('pilot', 'professional', 'enterprise'));

create index if not exists organizations_status_idx on public.organizations (status);
create index if not exists organizations_plan_idx on public.organizations (plan);

create table if not exists public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_email text not null default '',
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_audit_log_created_idx
  on public.platform_audit_log (created_at desc);

alter table public.platform_audit_log enable row level security;

-- Platform admins pueden leer auditoría vía API con service role; sin policy pública de lectura

comment on table public.platform_admins is
  'Superusuarios internos de Vertia (SaaS). Separado de profiles.role admin del estudio.';

comment on table public.platform_audit_log is
  'Auditoría de acciones de plataforma: alta de orgs, owners, suspensiones, etc.';
