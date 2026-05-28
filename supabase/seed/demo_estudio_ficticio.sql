-- Datos de demo — Estudio Jurídico & Contable "Rivadeneira & Asociados"
-- Ejecutar DESPUÉS de migraciones 001–009.
-- Re-ejecutable: borra solo registros con prefijo de IDs demo (b100… / b200… / b300…).

-- ─── Limpieza idempotente ───────────────────────────────────────────────────
delete from public.contract_tasks
where id::text like 'b4000001-%' or client_id::text like 'b1000001-%' or contract_id::text like 'b3000001-%';

delete from public.contract_obligations
where id::text like 'b5000001-%' or contract_id::text like 'b3000001-%';

delete from public.activity_log
where id::text like 'b6000001-%';

delete from public.legal_contracts
where id::text like 'b3000001-%';

delete from public.matters
where id::text like 'b2000001-%';

delete from public.studio_clients
where id::text like 'b1000001-%';

-- ─── Clientes ───────────────────────────────────────────────────────────────
insert into public.studio_clients (id, name, cuit, practice_area, responsible_name, contact_email, notes)
values
  (
    'b1000001-0001-4001-8001-000000000001',
    'Acme Argentina S.A.',
    '30-71234567-8',
    'Tecnología y servicios',
    'Dra. Martina Rivadeneira',
    'martina.rivadeneira@demo.vertia.local',
    'Cliente demo — contratos de locación y servicios cloud.'
  ),
  (
    'b1000001-0001-4001-8001-000000000002',
    'Grupo Norte Logística S.R.L.',
    '30-70998877-1',
    'Transporte y depósitos',
    'Dr. Pablo Estévez',
    'pablo.estevez@demo.vertia.local',
    'Cliente demo — flota, depósitos y poderes bancarios.'
  ),
  (
    'b1000001-0001-4001-8001-000000000003',
    'Inversiones Patagonia S.A.',
    '30-70112233-4',
    'Holding inmobiliario',
    'Lic. Sofía Almada',
    'sofia.almada@demo.vertia.local',
    'Cliente demo — societario e impuestos.'
  );

-- ─── Expedientes ────────────────────────────────────────────────────────────
insert into public.matters (id, client_id, name, matter_type, reference_code, status)
values
  ('b2000001-0001-4001-8001-000000000001', 'b1000001-0001-4001-8001-000000000001', 'Locaciones comerciales 2024-2026', 'contractual', 'ACME-LOC-01', 'active'),
  ('b2000001-0001-4001-8001-000000000002', 'b1000001-0001-4001-8001-000000000001', 'Contrato servicios cloud', 'contractual', 'ACME-IT-02', 'active'),
  ('b2000001-0001-4001-8001-000000000003', 'b1000001-0001-4001-8001-000000000002', 'Operaciones logísticas CABA', 'general', 'NORTE-OPS-01', 'active'),
  ('b2000001-0001-4001-8001-000000000004', 'b1000001-0001-4001-8001-000000000003', 'Reorganización societaria', 'corporate', 'PATA-CORP-01', 'active');

-- ─── Contratos (texto indexado; PDF demo en storage opcional) ───────────────
insert into public.legal_contracts (
  id, file_name, storage_path, file_hash, status, processing_phase,
  extracted_text, client_name, folder_name, client_id, matter_id,
  starts_at, expires_at, contract_type, party_a, party_b,
  lifecycle_status, document_category, auto_renewal, renewal_notice_days,
  analysis_result, contract_metadata, created_at
) values
(
  'b3000001-0001-4001-8001-000000000001',
  'Locacion_Comercial_Caballito.pdf',
  'demo/acme/locacion_caballito.pdf',
  repeat('a1', 64),
  'indexed', 'completed',
  'CONTRATO DE LOCACIÓN. PARTES: Acme Argentina S.A. (locatario) y Inmobiliaria Delta S.A. (locador). PLAZO: 24 meses desde el 01/03/2025. DESTINO: uso comercial exclusivo oficinas administrativas. CANON: pesos mensuales ajustables por IPC. PENALIDAD: mora diaria del 0,15% sobre canon impago. RESCISIÓN: anticipada con indemnización equivalente a 3 meses de canon. CONFIDENCIALIDAD: información del local y operaciones. VENCIMIENTO: 28/02/2027 salvo prórroga escrita.',
  'Acme Argentina S.A.', 'Locaciones',
  'b1000001-0001-4001-8001-000000000001', 'b2000001-0001-4001-8001-000000000001',
  '2025-03-01T12:00:00Z', '2027-02-28T12:00:00Z',
  'Locación comercial', 'Acme Argentina S.A.', 'Inmobiliaria Delta S.A.',
  'expiring', 'lease', true, 60,
  null,
  '{"moneda":"ARS","obligaciones_clave":["Pago canon mensual","Informar sublocación"]}'::jsonb,
  now() - interval '45 days'
),
(
  'b3000001-0001-4001-8001-000000000002',
  'Contrato_Servicios_Cloud_2025.pdf',
  'demo/acme/servicios_cloud.pdf',
  repeat('a2', 64),
  'analyzed', 'completed',
  'CONTRATO DE SERVICIOS SAAS. PROVEEDOR: NubeSur S.A. CLIENTE: Acme Argentina S.A. SLA 99,5%. DATOS: alojados en Argentina. LIMITACIÓN DE RESPONSABILIDAD: tope anual igual al monto pagado en 12 meses. PENALIDADES por indisponibilidad superior al 0,5% mensual. RESCISIÓN: sin causa con preaviso 30 días. CONFIDENCIALIDAD recíproca 5 años. Jurisdicción: tribunales ordinarios CABA.',
  'Acme Argentina S.A.', 'Contratos IT',
  'b1000001-0001-4001-8001-000000000001', 'b2000001-0001-4001-8001-000000000002',
  '2025-01-15T12:00:00Z', '2026-12-31T12:00:00Z',
  'Servicios informáticos', 'Acme Argentina S.A.', 'NubeSur S.A.',
  'active', 'contract', false, 30,
  '{
    "score_riesgo": 62,
    "resumen_directorio": "Contrato de servicios cloud con limitación de responsabilidad acotada al canon anual y penalidades por SLA. Riesgo moderado-alto en continuidad operativa y tratamiento de datos. Recomendar anexo de niveles de servicio y backup documentado.",
    "clausulas_riesgo": [
      {
        "tipo": "rojo",
        "texto_original": "LIMITACIÓN DE RESPONSABILIDAD: tope anual igual al monto pagado en 12 meses.",
        "motivo": "Techo indemnizatorio bajo frente a daños por caída prolongada del servicio crítico.",
        "sugerencia": "Negociar cap mínimo o carve-out para datos personales y multas regulatorias."
      },
      {
        "tipo": "amarillo",
        "texto_original": "RESCISIÓN: sin causa con preaviso 30 días.",
        "motivo": "Plazo breve para migración de datos y continuidad.",
        "sugerencia": "Extender a 90 días con obligación de exportación asistida."
      }
    ],
    "metadatos": {
      "tipo_contrato": "Servicios SaaS",
      "parte_a": "Acme Argentina S.A.",
      "parte_b": "NubeSur S.A.",
      "fecha_inicio": "2025-01-15",
      "fecha_fin": "2026-12-31",
      "monto": 480000,
      "moneda": "ARS",
      "renovacion_automatica": false,
      "dias_aviso_rescision": 30,
      "obligaciones_clave": ["Pago mensual", "Notificar incidentes de seguridad"],
      "obligaciones_estructuradas": [
        {"titulo": "Renovación o rescisión", "fecha": "2026-11-30", "tipo": "notice"}
      ]
    }
  }'::jsonb,
  '{"moneda":"ARS","monto":480000}'::jsonb,
  now() - interval '30 days'
),
(
  'b3000001-0001-4001-8001-000000000003',
  'Acta_Directorio_Aprobacion_Cuentas.pdf',
  'demo/acme/acta_directorio.pdf',
  repeat('a3', 64),
  'indexed', 'completed',
  'ACTA DE DIRECTORIO. ACME ARGENTINA S.A. Fecha 15/12/2025. ORDEN DEL DÍA: aprobación estados contables, designación sindicos, autorización compra inmueble. RESOLUCIÓN UNÁNIME. Se deja constancia de cumplimiento Ley 19.550.',
  'Acme Argentina S.A.', 'Societario',
  'b1000001-0001-4001-8001-000000000001', null,
  '2025-12-15T12:00:00Z', null,
  'Acta de directorio', 'Acme Argentina S.A.', 'Directorio',
  'active', 'corporate', false, null,
  null, null,
  now() - interval '20 days'
),
(
  'b3000001-0001-4001-8001-000000000004',
  'Acuerdo_Transporte_Flota_Norte.pdf',
  'demo/norte/transporte_flota.pdf',
  repeat('b1', 64),
  'indexed', 'completed',
  'ACUERDO DE TRANSPORTE. GRUPO NORTE LOGÍSTICA S.R.L. y Transportes Río S.A. Vigencia hasta 30/06/2026. TARIFAS: tabla anexa revisable trimestralmente. PENALIDAD por demora superior a 48 hs. SEGURO de carga obligatorio. TERMINACIÓN por incumplimiento grave sin indemnización adicional.',
  'Grupo Norte Logística S.R.L.', 'Transporte',
  'b1000001-0001-4001-8001-000000000002', 'b2000001-0001-4001-8001-000000000003',
  '2024-07-01T12:00:00Z', '2026-06-30T12:00:00Z',
  'Acuerdo logístico', 'Grupo Norte Logística S.R.L.', 'Transportes Río S.A.',
  'expiring', 'contract', false, 45,
  null, null,
  now() - interval '60 days'
),
(
  'b3000001-0001-4001-8001-000000000005',
  'Poder_General_Bancario_2025.pdf',
  'demo/norte/poder_bancario.pdf',
  repeat('b2', 64),
  'indexed', 'completed',
  'PODER GENERAL BANCARIO. Otorgado por Grupo Norte Logística S.R.L. a favor de María Laura Gómez DNI 25.456.789. Facultades: operar cuentas, girar cheques, solicitar préstamos hasta USD 500.000. VIGENCIA: 12 meses desde 01/01/2026. RENUNCIA a revocación unilateral sin notificación fehaciente.',
  'Grupo Norte Logística S.R.L.', 'Poderes',
  'b1000001-0001-4001-8001-000000000002', null,
  '2026-01-01T12:00:00Z', '2026-12-31T12:00:00Z',
  'Poder general', 'Grupo Norte Logística S.R.L.', 'María Laura Gómez',
  'active', 'power_of_attorney', false, null,
  null, null,
  now() - interval '10 days'
),
(
  'b3000001-0001-4001-8001-000000000006',
  'Contrato_Deposito_Almacenaje.pdf',
  'demo/norte/deposito_almacenaje.pdf',
  repeat('b3', 64),
  'analyzed', 'completed',
  'CONTRATO DE DEPÓSITO Y ALMACENAJE. Partes: Grupo Norte Logística S.R.L. y Depósitos Sur S.A. Plazo 36 meses. RESPONSABILIDAD del depositario limitada a valor declarado de mercadería. EXCLUSIVIDAD de operador en zona sur GBA. Indemnización por daños directos comprobados. Cláusula compromisoria arbitral CCI.',
  'Grupo Norte Logística S.R.L.', 'Depósitos',
  'b1000001-0001-4001-8001-000000000002', 'b2000001-0001-4001-8001-000000000003',
  '2025-06-01T12:00:00Z', '2028-05-31T12:00:00Z',
  'Depósito', 'Grupo Norte Logística S.R.L.', 'Depósitos Sur S.A.',
  'active', 'lease', true, 90,
  '{
    "score_riesgo": 38,
    "resumen_directorio": "Contrato de almacenaje con responsabilidad limitada al valor declarado y arbitraje CCI. Riesgo moderado en cobertura de siniestros y exclusividad territorial.",
    "clausulas_riesgo": [
      {
        "tipo": "amarillo",
        "texto_original": "RESPONSABILIDAD del depositario limitada a valor declarado de mercadería.",
        "motivo": "Puede dejar sin cobertura mercadería no declarada o subvaluada.",
        "sugerencia": "Exigir póliza de seguro por valor de reposición y inventario mensual."
      }
    ],
    "metadatos": {
      "tipo_contrato": "Depósito",
      "renovacion_automatica": true,
      "dias_aviso_rescision": 90,
      "obligaciones_clave": ["Pago canon depósito", "Mantenimiento inventario"],
      "obligaciones_estructuradas": []
    }
  }'::jsonb,
  null,
  now() - interval '25 days'
);

-- Ajustar vencimiento “urgente” para demo (próximos 20 días)
update public.legal_contracts
set expires_at = (current_date + interval '18 days')::timestamptz,
    lifecycle_status = 'expiring'
where id = 'b3000001-0001-4001-8001-000000000004';

update public.legal_contracts
set expires_at = (current_date + interval '25 days')::timestamptz,
    lifecycle_status = 'expiring'
where id = 'b3000001-0001-4001-8001-000000000001';

-- ─── Obligaciones ───────────────────────────────────────────────────────────
insert into public.contract_obligations (id, contract_id, title, due_at, obligation_type, status, source)
values
  ('b5000001-0001-4001-8001-000000000001', 'b3000001-0001-4001-8001-000000000001', 'Revisar cláusula de renovación locación', current_date + interval '12 days', 'renewal', 'pending', 'manual'),
  ('b5000001-0001-4001-8001-000000000002', 'b3000001-0001-4001-8001-000000000002', 'Notificar rescisión o renovación SaaS', '2026-11-30T12:00:00Z', 'notice', 'pending', 'ai'),
  ('b5000001-0001-4001-8001-000000000003', 'b3000001-0001-4001-8001-000000000004', 'Renegociar tarifas transporte', current_date + interval '15 days', 'payment', 'pending', 'manual'),
  ('b5000001-0001-4001-8001-000000000004', 'b3000001-0001-4001-8001-000000000006', 'Auditar póliza de seguro depósito', current_date + interval '30 days', 'compliance', 'pending', 'manual');

-- ─── Tareas ─────────────────────────────────────────────────────────────────
insert into public.contract_tasks (id, contract_id, client_id, title, assignee_name, due_at, status, priority)
values
  ('b4000001-0001-4001-8001-000000000001', 'b3000001-0001-4001-8001-000000000004', 'b1000001-0001-4001-8001-000000000002', 'Enviar carta documento preaviso transporte', 'Dr. Pablo Estévez', current_date + interval '7 days', 'in_progress', 'urgent'),
  ('b4000001-0001-4001-8001-000000000002', 'b3000001-0001-4001-8001-000000000001', 'b1000001-0001-4001-8001-000000000001', 'Coordinar reunión con locador Delta', 'Dra. Martina Rivadeneira', current_date + interval '10 days', 'pending', 'high'),
  ('b4000001-0001-4001-8001-000000000003', null, 'b1000001-0001-4001-8001-000000000003', 'Preparar acta de directorio trimestral', 'Lic. Sofía Almada', current_date + interval '20 days', 'pending', 'normal');

-- ─── Bitácora de actividad ──────────────────────────────────────────────────
insert into public.activity_log (id, action, entity_type, entity_id, entity_label, actor_name, metadata, created_at)
values
  ('b6000001-0001-4001-8001-000000000001', 'client.created', 'studio_client', 'b1000001-0001-4001-8001-000000000001', 'Acme Argentina S.A.', 'Dra. Martina Rivadeneira', null, now() - interval '2 days'),
  ('b6000001-0001-4001-8001-000000000002', 'contract.uploaded', 'legal_contract', 'b3000001-0001-4001-8001-000000000001', 'Locacion_Comercial_Caballito.pdf', 'Paralegal Demo', null, now() - interval '45 days'),
  ('b6000001-0001-4001-8001-000000000003', 'contract.analyzed', 'legal_contract', 'b3000001-0001-4001-8001-000000000002', 'Contrato_Servicios_Cloud_2025.pdf', 'Dra. Martina Rivadeneira', '{"score_riesgo":62}', now() - interval '5 days'),
  ('b6000001-0001-4001-8001-000000000004', 'task.created', 'contract_task', 'b4000001-0001-4001-8001-000000000001', 'Enviar carta documento preaviso transporte', 'Dr. Pablo Estévez', null, now() - interval '1 day'),
  ('b6000001-0001-4001-8001-000000000005', 'contract.exported', 'legal_contract', 'b3000001-0001-4001-8001-000000000002', 'Contrato_Servicios_Cloud_2025.pdf', 'Dra. Martina Rivadeneira', '{"format":"html"}', now() - interval '3 hours');
