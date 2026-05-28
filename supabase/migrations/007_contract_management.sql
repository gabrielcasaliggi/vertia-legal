-- Fase 2 CLM: archivado suave y gestión documental

alter table public.legal_contracts
  add column if not exists archived_at timestamptz;

create index if not exists legal_contracts_archived_at_idx
  on public.legal_contracts (archived_at)
  where archived_at is not null;
