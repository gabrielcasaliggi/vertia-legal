-- Fase 1 CLM: metadatos contractuales, ciclo de vida y FTS enriquecido

alter table public.legal_contracts
  add column if not exists starts_at timestamptz,
  add column if not exists contract_type text,
  add column if not exists party_a text,
  add column if not exists party_b text,
  add column if not exists lifecycle_status text not null default 'unknown',
  add column if not exists contract_metadata jsonb;

alter table public.legal_contracts
  drop constraint if exists legal_contracts_lifecycle_status_check;

alter table public.legal_contracts
  add constraint legal_contracts_lifecycle_status_check
  check (
    lifecycle_status in ('draft', 'active', 'expiring', 'expired', 'unknown')
  );

alter table public.legal_contracts
  drop constraint if exists legal_contracts_processing_phase_check;

alter table public.legal_contracts
  add constraint legal_contracts_processing_phase_check
  check (
    processing_phase in (
      'uploading_storage',
      'computing_hash',
      'extracting_text',
      'registering_record',
      'indexing_search',
      'ai_analysis',
      'completed',
      'failed'
    )
  );

alter table public.legal_contracts
  drop column if exists search_vector;

alter table public.legal_contracts
  add column search_vector tsvector
  generated always as (
    to_tsvector(
      'spanish',
      coalesce(file_name, '') || ' ' ||
      coalesce(client_name, '') || ' ' ||
      coalesce(folder_name, '') || ' ' ||
      coalesce(contract_type, '') || ' ' ||
      coalesce(party_a, '') || ' ' ||
      coalesce(party_b, '') || ' ' ||
      coalesce(extracted_text, '')
    )
  ) stored;

create index if not exists legal_contracts_search_vector_idx
  on public.legal_contracts
  using gin (search_vector);

create index if not exists legal_contracts_lifecycle_status_idx
  on public.legal_contracts (lifecycle_status);
