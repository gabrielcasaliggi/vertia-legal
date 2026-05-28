-- Validación comercial: clientes, expedientes, bitácora y tareas

-- Clientes del estudio (empresas/personas atendidas)
create table if not exists public.studio_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cuit text,
  practice_area text,
  responsible_name text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_clients_name_idx on public.studio_clients (name);

-- Expedientes / asuntos vinculados a un cliente
create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.studio_clients (id) on delete cascade,
  name text not null,
  matter_type text not null default 'general',
  reference_code text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matters_status_check check (status in ('active', 'closed', 'archived')),
  constraint matters_type_check check (
    matter_type in (
      'general',
      'contractual',
      'corporate',
      'tax',
      'labor',
      'litigation',
      'compliance'
    )
  )
);

create index if not exists matters_client_id_idx on public.matters (client_id);

-- Vincular contratos a cliente/expediente formal (opcional, retrocompatible)
alter table public.legal_contracts
  add column if not exists client_id uuid references public.studio_clients (id) on delete set null,
  add column if not exists matter_id uuid references public.matters (id) on delete set null;

create index if not exists legal_contracts_client_id_idx on public.legal_contracts (client_id);
create index if not exists legal_contracts_matter_id_idx on public.legal_contracts (matter_id);

-- Tipos documentales ampliados (filtro legal/contable)
alter table public.legal_contracts
  add column if not exists document_category text;

comment on column public.legal_contracts.document_category is
  'contract | corporate | tax | power_of_attorney | lease | employment | other';

-- Bitácora de actividad
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  actor_name text not null default 'Sistema',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
create index if not exists activity_log_entity_idx on public.activity_log (entity_type, entity_id);

-- Tareas operativas (vencimientos, obligaciones, seguimiento)
create table if not exists public.contract_tasks (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.legal_contracts (id) on delete cascade,
  obligation_id uuid references public.contract_obligations (id) on delete set null,
  client_id uuid references public.studio_clients (id) on delete set null,
  title text not null,
  description text,
  assignee_name text,
  due_at timestamptz,
  status text not null default 'pending',
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_tasks_status_check check (
    status in ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  constraint contract_tasks_priority_check check (
    priority in ('low', 'normal', 'high', 'urgent')
  )
);

create index if not exists contract_tasks_due_at_idx on public.contract_tasks (due_at);
create index if not exists contract_tasks_assignee_idx on public.contract_tasks (assignee_name);
create index if not exists contract_tasks_status_idx on public.contract_tasks (status);
