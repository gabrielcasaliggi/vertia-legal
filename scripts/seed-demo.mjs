#!/usr/bin/env node
/**
 * Carga datos de demo vía Supabase service role.
 * Uso: npm run seed:demo
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    return;
  }
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Configurá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const IDS = {
  clients: {
    acme: "b1000001-0001-4001-8001-000000000001",
    norte: "b1000001-0001-4001-8001-000000000002",
    patagonia: "b1000001-0001-4001-8001-000000000003",
  },
  matters: {
    acmeLoc: "b2000001-0001-4001-8001-000000000001",
    acmeIt: "b2000001-0001-4001-8001-000000000002",
    norteOps: "b2000001-0001-4001-8001-000000000003",
    pataCorp: "b2000001-0001-4001-8001-000000000004",
  },
  contracts: {
    locacion: "b3000001-0001-4001-8001-000000000001",
    cloud: "b3000001-0001-4001-8001-000000000002",
    acta: "b3000001-0001-4001-8001-000000000003",
    transporte: "b3000001-0001-4001-8001-000000000004",
    poder: "b3000001-0001-4001-8001-000000000005",
    deposito: "b3000001-0001-4001-8001-000000000006",
  },
};

const analysisCloud = {
  score_riesgo: 62,
  resumen_directorio:
    "Contrato de servicios cloud con limitación de responsabilidad acotada al canon anual y penalidades por SLA. Riesgo moderado-alto en continuidad operativa.",
  clausulas_riesgo: [
    {
      tipo: "rojo",
      texto_original:
        "LIMITACIÓN DE RESPONSABILIDAD: tope anual igual al monto pagado en 12 meses.",
      motivo: "Techo indemnizatorio bajo frente a daños por caída prolongada del servicio.",
      sugerencia: "Negociar cap mínimo o carve-out para datos personales.",
    },
    {
      tipo: "amarillo",
      texto_original: "RESCISIÓN: sin causa con preaviso 30 días.",
      motivo: "Plazo breve para migración de datos.",
      sugerencia: "Extender a 90 días con exportación asistida.",
    },
  ],
  metadatos: {
    tipo_contrato: "Servicios SaaS",
    parte_a: "Acme Argentina S.A.",
    parte_b: "NubeSur S.A.",
    fecha_inicio: "2025-01-15",
    fecha_fin: "2026-12-31",
    monto: 480000,
    moneda: "ARS",
    renovacion_automatica: false,
    dias_aviso_rescision: 30,
    obligaciones_clave: ["Pago mensual", "Notificar incidentes de seguridad"],
    obligaciones_estructuradas: [
      { titulo: "Renovación o rescisión", fecha: "2026-11-30", tipo: "notice" },
    ],
  },
};

const analysisDeposito = {
  score_riesgo: 38,
  resumen_directorio:
    "Contrato de almacenaje con responsabilidad limitada y arbitraje CCI. Riesgo moderado en cobertura de siniestros.",
  clausulas_riesgo: [
    {
      tipo: "amarillo",
      texto_original:
        "RESPONSABILIDAD del depositario limitada a valor declarado de mercadería.",
      motivo: "Puede dejar sin cobertura mercadería subvaluada.",
      sugerencia: "Exigir póliza por valor de reposición.",
    },
  ],
  metadatos: {
    tipo_contrato: "Depósito",
    renovacion_automatica: true,
    dias_aviso_rescision: 90,
    obligaciones_clave: ["Pago canon depósito"],
    obligaciones_estructuradas: [],
  },
};

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function cleanup() {
  const contractIds = Object.values(IDS.contracts);
  const clientIds = Object.values(IDS.clients);

  await supabase.from("contract_tasks").delete().in("contract_id", contractIds);
  await supabase.from("contract_tasks").delete().in("client_id", clientIds);
  await supabase.from("contract_obligations").delete().in("contract_id", contractIds);
  await supabase.from("activity_log").delete().like("id", "b6000001-%");
  await supabase.from("legal_contracts").delete().in("id", contractIds);
  await supabase.from("matters").delete().in("id", Object.values(IDS.matters));
  await supabase.from("studio_clients").delete().in("id", clientIds);
}

async function upsert(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

async function main() {
  console.log("Limpiando datos demo previos...");
  await cleanup();

  console.log("Insertando clientes y expedientes...");
  await upsert("studio_clients", [
    {
      id: IDS.clients.acme,
      name: "Acme Argentina S.A.",
      cuit: "30-71234567-8",
      practice_area: "Tecnología y servicios",
      responsible_name: "Dra. Martina Rivadeneira",
      contact_email: "martina.rivadeneira@demo.vertia.local",
      notes: "Cliente demo — locación y servicios cloud.",
    },
    {
      id: IDS.clients.norte,
      name: "Grupo Norte Logística S.R.L.",
      cuit: "30-70998877-1",
      practice_area: "Transporte y depósitos",
      responsible_name: "Dr. Pablo Estévez",
      contact_email: "pablo.estevez@demo.vertia.local",
      notes: "Cliente demo — logística y poderes.",
    },
    {
      id: IDS.clients.patagonia,
      name: "Inversiones Patagonia S.A.",
      cuit: "30-70112233-4",
      practice_area: "Holding inmobiliario",
      responsible_name: "Lic. Sofía Almada",
      contact_email: "sofia.almada@demo.vertia.local",
      notes: "Cliente demo — societario.",
    },
  ]);

  await upsert("matters", [
    {
      id: IDS.matters.acmeLoc,
      client_id: IDS.clients.acme,
      name: "Locaciones comerciales 2024-2026",
      matter_type: "contractual",
      reference_code: "ACME-LOC-01",
      status: "active",
    },
    {
      id: IDS.matters.acmeIt,
      client_id: IDS.clients.acme,
      name: "Contrato servicios cloud",
      matter_type: "contractual",
      reference_code: "ACME-IT-02",
      status: "active",
    },
    {
      id: IDS.matters.norteOps,
      client_id: IDS.clients.norte,
      name: "Operaciones logísticas CABA",
      matter_type: "general",
      reference_code: "NORTE-OPS-01",
      status: "active",
    },
    {
      id: IDS.matters.pataCorp,
      client_id: IDS.clients.patagonia,
      name: "Reorganización societaria",
      matter_type: "corporate",
      reference_code: "PATA-CORP-01",
      status: "active",
    },
  ]);

  const hash = "a".repeat(64);

  console.log("Insertando contratos con texto indexado...");
  await upsert("legal_contracts", [
    {
      id: IDS.contracts.locacion,
      file_name: "Locacion_Comercial_Caballito.pdf",
      storage_path: "demo/acme/locacion_caballito.pdf",
      file_hash: hash,
      status: "indexed",
      processing_phase: "completed",
      extracted_text:
        "CONTRATO DE LOCACIÓN. PENALIDAD por mora diaria. RESCISIÓN anticipada con indemnización. CONFIDENCIALIDAD. Acme Argentina S.A. e Inmobiliaria Delta S.A.",
      client_name: "Acme Argentina S.A.",
      folder_name: "Locaciones",
      client_id: IDS.clients.acme,
      matter_id: IDS.matters.acmeLoc,
      starts_at: "2025-03-01T12:00:00Z",
      expires_at: daysFromNow(25),
      contract_type: "Locación comercial",
      party_a: "Acme Argentina S.A.",
      party_b: "Inmobiliaria Delta S.A.",
      lifecycle_status: "expiring",
      document_category: "lease",
      auto_renewal: true,
      renewal_notice_days: 60,
    },
    {
      id: IDS.contracts.cloud,
      file_name: "Contrato_Servicios_Cloud_2025.pdf",
      storage_path: "demo/acme/servicios_cloud.pdf",
      file_hash: hash,
      status: "analyzed",
      processing_phase: "completed",
      extracted_text:
        "CONTRATO SAAS. LIMITACIÓN DE RESPONSABILIDAD tope anual. PENALIDADES por indisponibilidad. RESCISIÓN con preaviso 30 días. CONFIDENCIALIDAD recíproca.",
      client_name: "Acme Argentina S.A.",
      folder_name: "Contratos IT",
      client_id: IDS.clients.acme,
      matter_id: IDS.matters.acmeIt,
      starts_at: "2025-01-15T12:00:00Z",
      expires_at: "2026-12-31T12:00:00Z",
      contract_type: "Servicios informáticos",
      party_a: "Acme Argentina S.A.",
      party_b: "NubeSur S.A.",
      lifecycle_status: "active",
      document_category: "contract",
      auto_renewal: false,
      analysis_result: analysisCloud,
      contract_metadata: { moneda: "ARS", monto: 480000 },
    },
    {
      id: IDS.contracts.acta,
      file_name: "Acta_Directorio_Aprobacion_Cuentas.pdf",
      storage_path: "demo/acme/acta_directorio.pdf",
      file_hash: hash,
      status: "indexed",
      processing_phase: "completed",
      extracted_text:
        "ACTA DE DIRECTORIO ACME ARGENTINA S.A. Aprobación estados contables. Ley 19.550.",
      client_name: "Acme Argentina S.A.",
      folder_name: "Societario",
      client_id: IDS.clients.acme,
      starts_at: "2025-12-15T12:00:00Z",
      contract_type: "Acta de directorio",
      party_a: "Acme Argentina S.A.",
      party_b: "Directorio",
      lifecycle_status: "active",
      document_category: "corporate",
      auto_renewal: false,
    },
    {
      id: IDS.contracts.transporte,
      file_name: "Acuerdo_Transporte_Flota_Norte.pdf",
      storage_path: "demo/norte/transporte_flota.pdf",
      file_hash: hash,
      status: "indexed",
      processing_phase: "completed",
      extracted_text:
        "ACUERDO DE TRANSPORTE Grupo Norte Logística. PENALIDAD por demora. TERMINACIÓN por incumplimiento. Vigencia hasta junio 2026.",
      client_name: "Grupo Norte Logística S.R.L.",
      folder_name: "Transporte",
      client_id: IDS.clients.norte,
      matter_id: IDS.matters.norteOps,
      starts_at: "2024-07-01T12:00:00Z",
      expires_at: daysFromNow(18),
      contract_type: "Acuerdo logístico",
      party_a: "Grupo Norte Logística S.R.L.",
      party_b: "Transportes Río S.A.",
      lifecycle_status: "expiring",
      document_category: "contract",
      auto_renewal: false,
      renewal_notice_days: 45,
    },
    {
      id: IDS.contracts.poder,
      file_name: "Poder_General_Bancario_2025.pdf",
      storage_path: "demo/norte/poder_bancario.pdf",
      file_hash: hash,
      status: "indexed",
      processing_phase: "completed",
      extracted_text:
        "PODER GENERAL BANCARIO Grupo Norte Logística S.R.L. Facultades cuentas y cheques. VIGENCIA 12 meses.",
      client_name: "Grupo Norte Logística S.R.L.",
      folder_name: "Poderes",
      client_id: IDS.clients.norte,
      starts_at: "2026-01-01T12:00:00Z",
      expires_at: "2026-12-31T12:00:00Z",
      contract_type: "Poder general",
      party_a: "Grupo Norte Logística S.R.L.",
      party_b: "María Laura Gómez",
      lifecycle_status: "active",
      document_category: "power_of_attorney",
      auto_renewal: false,
    },
    {
      id: IDS.contracts.deposito,
      file_name: "Contrato_Deposito_Almacenaje.pdf",
      storage_path: "demo/norte/deposito_almacenaje.pdf",
      file_hash: hash,
      status: "analyzed",
      processing_phase: "completed",
      extracted_text:
        "CONTRATO DE DEPÓSITO. RESPONSABILIDAD limitada al valor declarado. EXCLUSIVIDAD zona sur. Arbitraje CCI.",
      client_name: "Grupo Norte Logística S.R.L.",
      folder_name: "Depósitos",
      client_id: IDS.clients.norte,
      matter_id: IDS.matters.norteOps,
      starts_at: "2025-06-01T12:00:00Z",
      expires_at: "2028-05-31T12:00:00Z",
      contract_type: "Depósito",
      party_a: "Grupo Norte Logística S.R.L.",
      party_b: "Depósitos Sur S.A.",
      lifecycle_status: "active",
      document_category: "lease",
      auto_renewal: true,
      renewal_notice_days: 90,
      analysis_result: analysisDeposito,
    },
  ]);

  console.log("Insertando obligaciones, tareas y bitácora...");
  await upsert("contract_obligations", [
    {
      id: "b5000001-0001-4001-8001-000000000001",
      contract_id: IDS.contracts.locacion,
      title: "Revisar cláusula de renovación locación",
      due_at: daysFromNow(12),
      obligation_type: "renewal",
      status: "pending",
      source: "manual",
    },
    {
      id: "b5000001-0001-4001-8001-000000000002",
      contract_id: IDS.contracts.cloud,
      title: "Notificar rescisión o renovación SaaS",
      due_at: "2026-11-30T12:00:00Z",
      obligation_type: "notice",
      status: "pending",
      source: "ai",
    },
    {
      id: "b5000001-0001-4001-8001-000000000003",
      contract_id: IDS.contracts.transporte,
      title: "Renegociar tarifas transporte",
      due_at: daysFromNow(15),
      obligation_type: "payment",
      status: "pending",
      source: "manual",
    },
  ]);

  await upsert("contract_tasks", [
    {
      id: "b4000001-0001-4001-8001-000000000001",
      contract_id: IDS.contracts.transporte,
      client_id: IDS.clients.norte,
      title: "Enviar carta documento preaviso transporte",
      assignee_name: "Dr. Pablo Estévez",
      due_at: daysFromNow(7),
      status: "in_progress",
      priority: "urgent",
    },
    {
      id: "b4000001-0001-4001-8001-000000000002",
      contract_id: IDS.contracts.locacion,
      client_id: IDS.clients.acme,
      title: "Coordinar reunión con locador Delta",
      assignee_name: "Dra. Martina Rivadeneira",
      due_at: daysFromNow(10),
      status: "pending",
      priority: "high",
    },
    {
      id: "b4000001-0001-4001-8001-000000000003",
      client_id: IDS.clients.patagonia,
      title: "Preparar acta de directorio trimestral",
      assignee_name: "Lic. Sofía Almada",
      due_at: daysFromNow(20),
      status: "pending",
      priority: "normal",
    },
  ]);

  await upsert("activity_log", [
    {
      id: "b6000001-0001-4001-8001-000000000001",
      action: "client.created",
      entity_type: "studio_client",
      entity_id: IDS.clients.acme,
      entity_label: "Acme Argentina S.A.",
      actor_name: "Dra. Martina Rivadeneira",
    },
    {
      id: "b6000001-0001-4001-8001-000000000002",
      action: "contract.uploaded",
      entity_type: "legal_contract",
      entity_id: IDS.contracts.locacion,
      entity_label: "Locacion_Comercial_Caballito.pdf",
      actor_name: "Paralegal Demo",
    },
    {
      id: "b6000001-0001-4001-8001-000000000003",
      action: "contract.analyzed",
      entity_type: "legal_contract",
      entity_id: IDS.contracts.cloud,
      entity_label: "Contrato_Servicios_Cloud_2025.pdf",
      actor_name: "Dra. Martina Rivadeneira",
      metadata: { score_riesgo: 62 },
    },
    {
      id: "b6000001-0001-4001-8001-000000000004",
      action: "task.created",
      entity_type: "contract_task",
      entity_id: "b4000001-0001-4001-8001-000000000001",
      entity_label: "Enviar carta documento preaviso transporte",
      actor_name: "Dr. Pablo Estévez",
    },
  ]);

  console.log("\n✓ Demo cargada correctamente.\n");
  console.log("Clientes: Acme Argentina S.A. | Grupo Norte Logística | Patagonia");
  console.log('Búsqueda sugerida: "penalidad" o "rescisión"');
  console.log("Contrato ya auditado: Contrato_Servicios_Cloud_2025.pdf (riesgo 62)");
  console.log("URL: http://localhost:3000/clients\n");
}

main().catch((error) => {
  console.error("Error al cargar demo:", error.message);
  process.exit(1);
});
