import type { AssistedQueryMode } from "@/lib/contracts/assisted-query";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export interface AssistedQueryHistoryEntry {
  id: string;
  created_at: string;
  actor_name: string;
  modo: AssistedQueryMode;
  pregunta: string;
  respuesta_breve: string | null;
  contexto_insuficiente: boolean;
}

const MODES: AssistedQueryMode[] = [
  "document_query",
  "legal_doubt",
  "risk_review",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMetadata(metadata: Json | null): {
  modo: AssistedQueryMode;
  pregunta: string;
  respuesta_breve: string | null;
  contexto_insuficiente: boolean;
} {
  if (!isRecord(metadata)) {
    return {
      modo: "document_query",
      pregunta: "",
      respuesta_breve: null,
      contexto_insuficiente: false,
    };
  }

  const modoRaw = metadata.modo;
  const modo = MODES.includes(modoRaw as AssistedQueryMode)
    ? (modoRaw as AssistedQueryMode)
    : "document_query";

  return {
    modo,
    pregunta:
      typeof metadata.pregunta === "string" ? metadata.pregunta.trim() : "",
    respuesta_breve:
      typeof metadata.respuesta_breve === "string" && metadata.respuesta_breve.trim()
        ? metadata.respuesta_breve.trim()
        : null,
    contexto_insuficiente: metadata.contexto_insuficiente === true,
  };
}

export async function fetchContractAssistedQueries(
  contractId: string,
  limit = 25,
): Promise<AssistedQueryHistoryEntry[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("activity_log")
    .select("id, actor_name, metadata, created_at")
    .eq("action", "contract.assisted_query")
    .eq("entity_id", contractId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const parsed = parseMetadata(row.metadata);
    return {
      id: row.id,
      created_at: row.created_at,
      actor_name: row.actor_name,
      modo: parsed.modo,
      pregunta: parsed.pregunta,
      respuesta_breve: parsed.respuesta_breve,
      contexto_insuficiente: parsed.contexto_insuficiente,
    };
  });
}
