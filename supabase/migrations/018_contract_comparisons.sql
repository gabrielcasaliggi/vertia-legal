-- Historial persistente de comparaciones contractuales

create table if not exists public.contract_comparisons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  base_contract_id uuid not null references public.legal_contracts (id) on delete cascade,
  compared_contract_id uuid not null references public.legal_contracts (id) on delete cascade,
  base_file_name text not null,
  compared_file_name text not null,
  summary text not null,
  risk_side text not null,
  base_score integer not null,
  compared_score integer not null,
  critical_count integer not null default 0,
  comparison_result jsonb not null,
  model text not null default 'llama-3.3-70b-versatile',
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_name text not null default 'Operador',
  created_at timestamptz not null default now()
);

create index if not exists contract_comparisons_org_idx
  on public.contract_comparisons (organization_id, created_at desc);

create index if not exists contract_comparisons_base_idx
  on public.contract_comparisons (base_contract_id, created_at desc);

create index if not exists contract_comparisons_compared_idx
  on public.contract_comparisons (compared_contract_id, created_at desc);

alter table public.contract_comparisons enable row level security;

create policy "Org members access contract_comparisons"
  on public.contract_comparisons for all to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));
