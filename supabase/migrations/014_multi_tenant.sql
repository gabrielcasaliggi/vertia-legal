-- Fase 5: multi-tenant (organizaciones / estudios)

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_members_user_idx
  on public.organization_members (user_id);

-- Organización por defecto para datos existentes
insert into public.organizations (name, slug)
values ('Estudio Principal', 'default')
on conflict (slug) do nothing;

alter table public.legal_contracts
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.studio_clients
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.matters
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.contract_tasks
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.contract_obligations
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.activity_log
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.contract_versions
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.contract_audits
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.contract_ai_queries
  add column if not exists organization_id uuid references public.organizations (id);

-- Asignar org default a filas existentes
do $$
declare
  default_org_id uuid;
begin
  select id into default_org_id from public.organizations where slug = 'default' limit 1;

  update public.legal_contracts set organization_id = default_org_id where organization_id is null;
  update public.studio_clients set organization_id = default_org_id where organization_id is null;
  update public.matters set organization_id = default_org_id where organization_id is null;
  update public.contract_tasks set organization_id = default_org_id where organization_id is null;
  update public.contract_obligations co
    set organization_id = lc.organization_id
    from public.legal_contracts lc
    where co.contract_id = lc.id and co.organization_id is null;
  update public.activity_log set organization_id = default_org_id where organization_id is null;
  update public.contract_versions cv
    set organization_id = lc.organization_id
    from public.legal_contracts lc
    where cv.contract_id = lc.id and cv.organization_id is null;
  update public.contract_audits ca
    set organization_id = lc.organization_id
    from public.legal_contracts lc
    where ca.contract_id = lc.id and ca.organization_id is null;
  update public.contract_ai_queries cq
    set organization_id = lc.organization_id
    from public.legal_contracts lc
    where cq.contract_id = lc.id and cq.organization_id is null;

  insert into public.organization_members (organization_id, user_id, role)
  select default_org_id, p.id, case when p.role = 'admin' then 'owner' else 'member' end
  from public.profiles p
  where not exists (
    select 1 from public.organization_members om
    where om.organization_id = default_org_id and om.user_id = p.id
  );
end $$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create or replace function public.current_user_organization_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid() and is_active = true;
$$;

create policy "Members read own organizations"
  on public.organizations for select to authenticated
  using (id in (select public.current_user_organization_ids()));

create policy "Members read organization_members"
  on public.organization_members for select to authenticated
  using (organization_id in (select public.current_user_organization_ids()));

create index if not exists legal_contracts_org_idx on public.legal_contracts (organization_id);
create index if not exists studio_clients_org_idx on public.studio_clients (organization_id);
