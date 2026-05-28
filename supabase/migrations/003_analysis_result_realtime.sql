-- Persiste el resultado del motor Groq y habilita sync en tiempo real para el HUD
alter table public.legal_contracts
  add column if not exists analysis_result jsonb;

alter publication supabase_realtime add table public.legal_contracts;

create policy "HUD read access on legal_contracts"
  on public.legal_contracts
  for select
  to anon, authenticated
  using (true);
