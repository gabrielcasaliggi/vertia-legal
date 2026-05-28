import {
  parseContractAnalysisResult,
  type ContractAnalysisResult,
} from "@/lib/contracts/analysis";
import {
  refreshOverdueObligationStatuses,
  syncObligationsFromAnalysis,
} from "@/lib/contracts/obligations-service";
import { computeLifecycleStatus } from "@/lib/contracts/lifecycle";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ContractMetadata } from "@/lib/supabase/types";

export class ContractAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractAnalysisError";
  }
}

export async function assertContractReadyForAnalysis(
  contractId: string,
): Promise<{ extracted_text: string }> {
  const supabase = createServerSupabaseClient();

  const { data: contract, error: fetchError } = await supabase
    .from("legal_contracts")
    .select("id, status, extracted_text")
    .eq("id", contractId)
    .single();

  if (fetchError || !contract) {
    throw new ContractAnalysisError("No se encontró el contrato especificado.");
  }

  if (contract.status !== "indexed" && contract.status !== "pending_analysis") {
    throw new ContractAnalysisError(
      `El contrato no está listo para auditoría (estado: ${contract.status}).`,
    );
  }

  if (!contract.extracted_text || contract.extracted_text.trim().length < 30) {
    throw new ContractAnalysisError(
      "El contrato no tiene texto indexado suficiente para auditoría cognitiva.",
    );
  }

  return { extracted_text: contract.extracted_text };
}

function buildMetadataUpdate(analysis: ContractAnalysisResult) {
  const meta = analysis.metadatos;
  if (!meta) {
    return {};
  }

  const startsAt = meta.fecha_inicio ?? undefined;
  const expiresAt = meta.fecha_fin ?? undefined;

  const contractMetadata: ContractMetadata = {
    monto: meta.monto,
    moneda: meta.moneda,
    obligaciones_clave: meta.obligaciones_clave,
  };

  return {
    contract_type: meta.tipo_contrato,
    party_a: meta.parte_a,
    party_b: meta.parte_b,
    auto_renewal: meta.renovacion_automatica,
    renewal_notice_days: meta.dias_aviso_rescision,
    ...(startsAt ? { starts_at: startsAt } : {}),
    ...(expiresAt ? { expires_at: expiresAt } : {}),
    lifecycle_status: computeLifecycleStatus(startsAt ?? null, expiresAt ?? null),
    contract_metadata: contractMetadata,
  };
}

export async function persistContractAnalysis(
  contractId: string,
  analysis: ContractAnalysisResult,
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const metadataUpdate = buildMetadataUpdate(analysis);

  const { data: current, error: fetchError } = await supabase
    .from("legal_contracts")
    .select("expires_at, auto_renewal, renewal_notice_days")
    .eq("id", contractId)
    .single();

  if (fetchError || !current) {
    throw new ContractAnalysisError("No se encontró el contrato para persistir análisis.");
  }

  const { error: updateError } = await supabase
    .from("legal_contracts")
    .update({
      status: "analyzed",
      analysis_result: analysis,
      processing_phase: "completed",
      ...metadataUpdate,
    })
    .eq("id", contractId)
    .in("status", ["indexed", "pending_analysis"]);

  if (updateError) {
    throw new ContractAnalysisError(
      `No se pudo persistir el análisis: ${updateError.message}`,
    );
  }

  const expiresAt: string | null =
    "expires_at" in metadataUpdate && typeof metadataUpdate.expires_at === "string"
      ? metadataUpdate.expires_at
      : current.expires_at;
  const autoRenewal =
    "auto_renewal" in metadataUpdate
      ? Boolean(metadataUpdate.auto_renewal)
      : Boolean(current.auto_renewal);
  const renewalNoticeDays: number | null =
    "renewal_notice_days" in metadataUpdate
      ? typeof metadataUpdate.renewal_notice_days === "number"
        ? metadataUpdate.renewal_notice_days
        : current.renewal_notice_days
      : current.renewal_notice_days;

  await syncObligationsFromAnalysis(contractId, analysis, {
    expiresAt,
    autoRenewal,
    renewalNoticeDays,
  });

  await refreshOverdueObligationStatuses(contractId);
}

export async function resetContractToPendingAnalysis(
  contractId: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("legal_contracts")
    .update({
      status: "pending_analysis",
      analysis_result: null,
      processing_phase: "extracting_text",
    })
    .eq("id", contractId);

  if (error) {
    throw new ContractAnalysisError(
      `No se pudo reiniciar el contrato para fallback visual: ${error.message}`,
    );
  }
}

export function parseGroqAnalysisResponse(rawContent: string): ContractAnalysisResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawContent);
  } catch {
    throw new ContractAnalysisError("La respuesta de Groq no es un JSON válido.");
  }

  const analysis = parseContractAnalysisResult(parsedJson);

  if (!analysis) {
    throw new ContractAnalysisError(
      "La respuesta de Groq no cumple el esquema JSON requerido.",
    );
  }

  return analysis;
}
