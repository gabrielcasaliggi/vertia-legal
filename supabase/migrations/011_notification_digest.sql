-- Registro de envíos de resumen por email (evita duplicados el mismo día)

create table if not exists public.notification_digest_log (
  id uuid primary key default gen_random_uuid(),
  digest_date date not null default (current_date),
  recipient_email text not null,
  expirations_count integer not null default 0,
  tasks_count integer not null default 0,
  obligations_count integer not null default 0,
  sent_at timestamptz not null default now(),
  constraint notification_digest_log_unique_day_email unique (digest_date, recipient_email)
);

create index if not exists notification_digest_log_sent_at_idx
  on public.notification_digest_log (sent_at desc);

alter table public.notification_digest_log enable row level security;

create policy "Service role full access on notification_digest_log"
  on public.notification_digest_log
  for all
  to service_role
  using (true)
  with check (true);
