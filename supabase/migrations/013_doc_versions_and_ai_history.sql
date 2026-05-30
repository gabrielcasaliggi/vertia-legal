-- Fase 3: versiones documentales e historial IA persistente

create table if not exists public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.legal_contracts (id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  file_hash text not null,
  file_name text not null,
  uploaded_by uuid references auth.users (id) on delete set null,
  uploaded_by_name text,
  created_at timestamptz not null default now(),
  unique (contract_id, version_number)
);

create index if not exists contract_versions_contract_idx
  on public.contract_versions (contract_id, version_number desc);

create table if not exists public.contract_audits (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.legal_contracts (id) on delete cascade,
  contract_version_id uuid references public.contract_versions (id) on delete set null,
  score_riesgo integer not null,
  analysis_result jsonb not null,
  model text not null default 'llama-3.3-70b-versatile',
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_name text not null default 'Operador',
  created_at timestamptz not null default now()
);

create index if not exists contract_audits_contract_idx
  on public.contract_audits (contract_id, created_at desc);

create table if not exists public.contract_ai_queries (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.legal_contracts (id) on delete cascade,
  modo text not null check (modo in ('document_query', 'legal_doubt', 'risk_review')),
  pregunta text not null,
  respuesta_estructurada jsonb not null,
  respuesta_texto text not null,
  contexto_insuficiente boolean not null default false,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_name text not null default 'Operador',
  created_at timestamptz not null default now()
);

create index if not exists contract_ai_queries_contract_idx
  on public.contract_ai_queries (contract_id, created_at desc);

alter table public.contract_versions enable row level security;
alter table public.contract_audits enable row level security;
alter table public.contract_ai_queries enable row level security;

create policy "Authenticated access contract_versions"
  on public.contract_versions for all to authenticated using (true) with check (true);

create policy "Authenticated access contract_audits"
  on public.contract_audits for all to authenticated using (true) with check (true);

create policy "Authenticated access contract_ai_queries"
  on public.contract_ai_queries for all to authenticated using (true) with check (true);

-- Backfill versión inicial para contratos existentes
insert into public.contract_versions (
  contract_id,
  version_number,
  storage_path,
  file_hash,
  file_name,
  uploaded_by_name
)
select
  lc.id,
  1,
  lc.storage_path,
  lc.file_hash,
  lc.file_name,
  'Migración'
from public.legal_contracts lc
where not exists (
  select 1 from public.contract_versions cv where cv.contract_id = lc.id
);
