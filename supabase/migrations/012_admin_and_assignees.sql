-- Fase 2: asignación de tareas por usuario

alter table public.contract_tasks
  add column if not exists assignee_user_id uuid references auth.users (id) on delete set null;

create index if not exists contract_tasks_assignee_user_idx
  on public.contract_tasks (assignee_user_id);

comment on column public.contract_tasks.assignee_user_id is
  'Usuario del estudio asignado; assignee_name queda como respaldo legible.';
