-- Tabla de contratos legales para Vertia Legal
create extension if not exists "pgcrypto";

create table if not exists public.legal_contracts (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null unique,
  file_hash text not null,
  status text not null default 'pending_analysis',
  processing_phase text not null default 'registering_record',
  analysis_result jsonb,
  created_at timestamptz not null default now(),
  constraint legal_contracts_status_check
    check (status in ('pending_analysis', 'analyzed')),
  constraint legal_contracts_processing_phase_check
    check (
      processing_phase in (
        'uploading_storage',
        'computing_hash',
        'extracting_text',
        'registering_record',
        'ai_analysis',
        'completed',
        'failed'
      )
    )
);

create index if not exists legal_contracts_file_hash_idx
  on public.legal_contracts (file_hash);

create index if not exists legal_contracts_status_idx
  on public.legal_contracts (status);

-- Bucket privado para PDFs contractuales
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do update
set public = excluded.public;

-- Políticas RLS: acceso restringido vía service role en API routes
alter table public.legal_contracts enable row level security;

create policy "Service role full access on legal_contracts"
  on public.legal_contracts
  for all
  to service_role
  using (true)
  with check (true);
