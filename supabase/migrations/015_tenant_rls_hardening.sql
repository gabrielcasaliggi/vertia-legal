-- Fase cierre: RLS por organización (defensa en profundidad)

-- legal_contracts
drop policy if exists "Authenticated read legal_contracts" on public.legal_contracts;
drop policy if exists "Authenticated insert legal_contracts" on public.legal_contracts;
drop policy if exists "Authenticated update legal_contracts" on public.legal_contracts;
drop policy if exists "Authenticated delete legal_contracts" on public.legal_contracts;
drop policy if exists "HUD read access on legal_contracts" on public.legal_contracts;

create policy "Org members read legal_contracts"
  on public.legal_contracts for select to authenticated
  using (organization_id in (select public.current_user_organization_ids()));

create policy "Org members insert legal_contracts"
  on public.legal_contracts for insert to authenticated
  with check (organization_id in (select public.current_user_organization_ids()));

create policy "Org members update legal_contracts"
  on public.legal_contracts for update to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));

create policy "Org members delete legal_contracts"
  on public.legal_contracts for delete to authenticated
  using (organization_id in (select public.current_user_organization_ids()));

-- studio_clients
drop policy if exists "Authenticated access studio_clients" on public.studio_clients;

create policy "Org members access studio_clients"
  on public.studio_clients for all to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));

-- matters
drop policy if exists "Authenticated access matters" on public.matters;

create policy "Org members access matters"
  on public.matters for all to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));

-- contract_tasks
drop policy if exists "Authenticated access contract_tasks" on public.contract_tasks;

create policy "Org members access contract_tasks"
  on public.contract_tasks for all to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));

-- contract_obligations
drop policy if exists "Authenticated insert contract_obligations" on public.contract_obligations;
drop policy if exists "Authenticated update contract_obligations" on public.contract_obligations;
drop policy if exists "Authenticated delete contract_obligations" on public.contract_obligations;
drop policy if exists "Anon read contract_obligations" on public.contract_obligations;

create policy "Org members access contract_obligations"
  on public.contract_obligations for all to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));

-- activity_log
drop policy if exists "Authenticated read activity_log" on public.activity_log;
drop policy if exists "Authenticated insert activity_log" on public.activity_log;

create policy "Org members read activity_log"
  on public.activity_log for select to authenticated
  using (organization_id in (select public.current_user_organization_ids()));

create policy "Org members insert activity_log"
  on public.activity_log for insert to authenticated
  with check (organization_id in (select public.current_user_organization_ids()));

-- contract_versions / audits / ai_queries
drop policy if exists "Authenticated access contract_versions" on public.contract_versions;
drop policy if exists "Authenticated access contract_audits" on public.contract_audits;
drop policy if exists "Authenticated access contract_ai_queries" on public.contract_ai_queries;

create policy "Org members access contract_versions"
  on public.contract_versions for all to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));

create policy "Org members access contract_audits"
  on public.contract_audits for all to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));

create policy "Org members access contract_ai_queries"
  on public.contract_ai_queries for all to authenticated
  using (organization_id in (select public.current_user_organization_ids()))
  with check (organization_id in (select public.current_user_organization_ids()));

-- organizations: admins pueden actualizar su org
create policy "Admins update own organizations"
  on public.organizations for update to authenticated
  using (
    id in (select public.current_user_organization_ids())
    and public.is_admin()
  )
  with check (
    id in (select public.current_user_organization_ids())
    and public.is_admin()
  );
