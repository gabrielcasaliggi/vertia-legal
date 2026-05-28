-- Fase 3 CLM: obligaciones contractuales y renovaciones

alter table public.legal_contracts
  add column if not exists auto_renewal boolean not null default false,
  add column if not exists renewal_notice_days integer;

create table if not exists public.contract_obligations (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.legal_contracts (id) on delete cascade,
  title text not null,
  due_at timestamptz,
  obligation_type text not null default 'general',
  status text not null default 'pending',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_obligations_type_check
    check (obligation_type in ('general', 'payment', 'renewal', 'notice', 'compliance')),
  constraint contract_obligations_status_check
    check (status in ('pending', 'completed', 'overdue')),
  constraint contract_obligations_source_check
    check (source in ('extracted', 'manual', 'ai'))
);

create index if not exists contract_obligations_contract_id_idx
  on public.contract_obligations (contract_id);

create index if not exists contract_obligations_due_at_idx
  on public.contract_obligations (due_at)
  where due_at is not null;

alter table public.contract_obligations enable row level security;

create policy "Service role full access on contract_obligations"
  on public.contract_obligations
  for all
  to service_role
  using (true)
  with check (true);

create policy "Anon read contract_obligations"
  on public.contract_obligations
  for select
  to anon, authenticated
  using (true);
