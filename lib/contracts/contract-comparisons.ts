import {
  parseContractComparisonResponse,
  type ContractComparisonResponse,
} from "@/lib/contracts/compare";
import { GROQ_MODEL } from "@/lib/groq/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export interface ContractComparisonListItem {
  id: string;
  base_contract_id: string;
  compared_contract_id: string;
  base_file_name: string;
  compared_file_name: string;
  summary: string;
  risk_side: string;
  base_score: number;
  compared_score: number;
  critical_count: number;
  actor_name: string;
  created_at: string;
}

function isMissingComparisonsTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes("contract_comparisons") === true ||
    error.message?.includes("schema cache") === true
  );
}

export async function persistContractComparison(input: {
  comparison: ContractComparisonResponse;
  organizationId: string;
  actorUserId?: string | null;
  actorName?: string;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { comparison, organizationId } = input;

  const { error } = await supabase.from("contract_comparisons").insert({
    id: comparison.comparison_id,
    organization_id: organizationId,
    base_contract_id: comparison.base.id,
    compared_contract_id: comparison.compared.id,
    base_file_name: comparison.base.file_name,
    compared_file_name: comparison.compared.file_name,
    summary: comparison.result.resumen_ejecutivo.slice(0, 500),
    risk_side: comparison.result.riesgo_comparativo.documento_mas_riesgoso,
    base_score: comparison.result.riesgo_comparativo.score_base,
    compared_score: comparison.result.riesgo_comparativo.score_comparado,
    critical_count: comparison.result.cambios_criticos.length,
    comparison_result: comparison as unknown as Json,
    model: GROQ_MODEL,
    actor_user_id: input.actorUserId ?? null,
    actor_name: input.actorName ?? "Operador",
  });

  if (error) {
    if (isMissingComparisonsTable(error)) {
      console.warn(
        "[contract_comparisons] Tabla no encontrada. Aplicá la migración 018_contract_comparisons.sql para habilitar historial.",
      );
      return;
    }

    console.error("[contract_comparisons] Failed to persist:", error.message);
  }
}

export async function fetchContractComparisons(
  organizationId: string,
  limit = 12,
  contractId?: string,
): Promise<ContractComparisonListItem[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("contract_comparisons")
    .select(
      "id, base_contract_id, compared_contract_id, base_file_name, compared_file_name, summary, risk_side, base_score, compared_score, critical_count, actor_name, created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (contractId) {
    query = query.or(
      `base_contract_id.eq.${contractId},compared_contract_id.eq.${contractId}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingComparisonsTable(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return data ?? [];
}

export async function fetchContractComparisonById(
  comparisonId: string,
  organizationId: string,
): Promise<ContractComparisonResponse | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("contract_comparisons")
    .select("comparison_result")
    .eq("id", comparisonId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (isMissingComparisonsTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return parseContractComparisonResponse(data.comparison_result);
}
