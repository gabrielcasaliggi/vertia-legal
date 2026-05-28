-- Solo necesaria si ya ejecutaste la versión antigua de 001 (sin 'analyzed').
-- En bases nuevas, ejecutá únicamente 001_legal_contracts.sql.
alter table public.legal_contracts
  drop constraint if exists legal_contracts_status_check;

alter table public.legal_contracts
  add constraint legal_contracts_status_check
  check (status in ('pending_analysis', 'analyzed'));
