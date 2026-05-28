-- Autenticación y perfiles de usuario del estudio

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'assistant',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (
    role in ('admin', 'lawyer', 'accountant', 'assistant')
  )
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "Users can update own profile name"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can manage profiles"
  on public.profiles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.studio_clients enable row level security;
alter table public.matters enable row level security;
alter table public.activity_log enable row level security;
alter table public.contract_tasks enable row level security;

-- Perfiles autenticados: acceso operativo al CLM (estudio único en piloto)
create policy "Authenticated read legal_contracts"
  on public.legal_contracts for select to authenticated using (true);

create policy "Authenticated insert legal_contracts"
  on public.legal_contracts for insert to authenticated with check (true);

create policy "Authenticated update legal_contracts"
  on public.legal_contracts for update to authenticated using (true) with check (true);

create policy "Authenticated delete legal_contracts"
  on public.legal_contracts for delete to authenticated using (true);

create policy "Authenticated access studio_clients"
  on public.studio_clients for all to authenticated using (true) with check (true);

create policy "Authenticated access matters"
  on public.matters for all to authenticated using (true) with check (true);

create policy "Authenticated insert contract_obligations"
  on public.contract_obligations for insert to authenticated with check (true);

create policy "Authenticated update contract_obligations"
  on public.contract_obligations for update to authenticated using (true) with check (true);

create policy "Authenticated delete contract_obligations"
  on public.contract_obligations for delete to authenticated using (true);

create policy "Authenticated access contract_tasks"
  on public.contract_tasks for all to authenticated using (true) with check (true);

create policy "Authenticated read activity_log"
  on public.activity_log for select to authenticated using (true);

create policy "Authenticated insert activity_log"
  on public.activity_log for insert to authenticated with check (true);

-- Storage: PDFs del bucket contracts para usuarios autenticados
create policy "Authenticated read contract files"
  on storage.objects for select to authenticated
  using (bucket_id = 'contracts');

create policy "Authenticated upload contract files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'contracts');

create policy "Authenticated update contract files"
  on storage.objects for update to authenticated
  using (bucket_id = 'contracts');

-- Trigger: crear perfil al registrarse (invites / admin script)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'assistant')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
