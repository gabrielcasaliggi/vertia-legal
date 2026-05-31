-- Fase cierre: configuración del estudio e indicador de calidad de indexación

alter table public.organizations
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists logo_url text,
  add column if not exists report_disclaimer text,
  add column if not exists report_responsible_name text;

alter table public.legal_contracts
  add column if not exists index_quality text not null default 'ok';

alter table public.legal_contracts
  drop constraint if exists legal_contracts_index_quality_check;

alter table public.legal_contracts
  add constraint legal_contracts_index_quality_check
  check (index_quality in ('ok', 'insufficient_text'));

comment on column public.legal_contracts.index_quality is
  'Calidad de indexación: ok = texto usable; insufficient_text = PDF escaneado o sin capa de texto.';

update public.organizations
set report_disclaimer = coalesce(
  report_disclaimer,
  'Este informe fue generado con apoyo de Vertia Legal y no reemplaza la revisión profesional de un abogado o contador.'
)
where report_disclaimer is null;
