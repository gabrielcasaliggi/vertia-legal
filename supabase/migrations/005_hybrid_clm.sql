-- Hybrid Smart CLM: indexación local + FTS + metadatos de explorador
alter table public.legal_contracts
  add column if not exists extracted_text text,
  add column if not exists client_name text not null default 'General',
  add column if not exists folder_name text not null default 'Expedientes',
  add column if not exists expires_at timestamptz;

alter table public.legal_contracts
  drop constraint if exists legal_contracts_status_check;

alter table public.legal_contracts
  add constraint legal_contracts_status_check
  check (status in ('indexed', 'analyzed', 'failed', 'pending_analysis'));

update public.legal_contracts
set status = 'indexed'
where status = 'pending_analysis'
  and analysis_result is null;

alter table public.legal_contracts
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'spanish',
      coalesce(file_name, '') || ' ' ||
      coalesce(client_name, '') || ' ' ||
      coalesce(folder_name, '') || ' ' ||
      coalesce(extracted_text, '')
    )
  ) stored;

create index if not exists legal_contracts_search_vector_idx
  on public.legal_contracts
  using gin (search_vector);

create index if not exists legal_contracts_client_folder_idx
  on public.legal_contracts (client_name, folder_name);

create index if not exists legal_contracts_expires_at_idx
  on public.legal_contracts (expires_at)
  where expires_at is not null;
