import type { ContractAnalysisResult } from "@/lib/contracts/analysis";
import { GROQ_MODEL } from "@/lib/groq/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export interface ContractAuditRecord {
  id: string;
  contract_id: string;
  score_riesgo: number;
  analysis_result: ContractAnalysisResult;
  model: string;
  actor_name: string;
  created_at: string;
}

export async function persistContractAudit(input: {
  contractId: string;
  analysis: ContractAnalysisResult;
  actorUserId?: string | null;
  actorName?: string;
  organizationId?: string | null;
  contractVersionId?: string | null;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("contract_audits").insert({
    contract_id: input.contractId,
    contract_version_id: input.contractVersionId ?? null,
    score_riesgo: input.analysis.score_riesgo,
    analysis_result: input.analysis as unknown as Json,
    model: GROQ_MODEL,
    actor_user_id: input.actorUserId ?? null,
    actor_name: input.actorName ?? "Operador",
    organization_id: input.organizationId ?? null,
  });
}

export async function fetchContractAudits(
  contractId: string,
  limit = 20,
): Promise<ContractAuditRecord[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contract_audits")
    .select("id, contract_id, score_riesgo, analysis_result, model, actor_name, created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    ...row,
    analysis_result: row.analysis_result as unknown as ContractAnalysisResult,
  }));
}
