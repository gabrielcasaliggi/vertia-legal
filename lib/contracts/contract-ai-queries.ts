import type { AssistedQueryMode, AssistedQueryResult } from "@/lib/contracts/assisted-query";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export interface ContractAiQueryRecord {
  id: string;
  contract_id: string;
  modo: AssistedQueryMode;
  pregunta: string;
  respuesta_breve: string | null;
  contexto_insuficiente: boolean;
  actor_name: string;
  created_at: string;
}

export async function persistContractAiQuery(input: {
  contractId: string;
  message: string;
  structured: AssistedQueryResult;
  respuestaTexto: string;
  actorUserId?: string | null;
  actorName?: string;
  organizationId?: string | null;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("contract_ai_queries").insert({
    contract_id: input.contractId,
    modo: input.structured.modo,
    pregunta: input.message.slice(0, 2000),
    respuesta_estructurada: input.structured as unknown as Json,
    respuesta_texto: input.respuestaTexto,
    contexto_insuficiente: input.structured.contexto_insuficiente,
    actor_user_id: input.actorUserId ?? null,
    actor_name: input.actorName ?? "Operador",
    organization_id: input.organizationId ?? null,
  });
}

export async function fetchContractAiQueries(
  contractId: string,
  limit = 25,
): Promise<ContractAiQueryRecord[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contract_ai_queries")
    .select(
      "id, contract_id, modo, pregunta, respuesta_estructurada, contexto_insuficiente, actor_name, created_at",
    )
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const structured = row.respuesta_estructurada as unknown as AssistedQueryResult | null;
    return {
      id: row.id,
      contract_id: row.contract_id,
      modo: row.modo as AssistedQueryMode,
      pregunta: row.pregunta,
      respuesta_breve: structured?.respuesta_breve ?? null,
      contexto_insuficiente: row.contexto_insuficiente,
      actor_name: row.actor_name,
      created_at: row.created_at,
    };
  });
}
