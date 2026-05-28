alter table public.legal_contracts
  add column if not exists processing_phase text not null default 'registering_record';

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
      'ai_analysis',
      'completed',
      'failed'
    )
  );
