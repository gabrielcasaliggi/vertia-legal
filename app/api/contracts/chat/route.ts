import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/contracts/activity-log";
import { persistContractAiQuery } from "@/lib/contracts/contract-ai-queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { getCurrentProfile } from "@/lib/auth/session";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import {
  runContractChat,
  type AssistedQueryMode,
  type ContractChatInput,
  type ContractChatMessage,
} from "@/lib/contracts/contract-chat";
import { extractMatchingSnippets } from "@/lib/contracts/search-intelligence";
import { GroqRateLimitError } from "@/lib/groq/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

function jsonError(
  error: string,
  status: number,
  details?: string,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status },
  );
}

const QUERY_MODES: AssistedQueryMode[] = [
  "document_query",
  "legal_doubt",
  "risk_review",
];

function isQueryMode(value: unknown): value is AssistedQueryMode {
  return typeof value === "string" && QUERY_MODES.includes(value as AssistedQueryMode);
}

function isChatMessage(value: unknown): value is ContractChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const role = (value as { role?: unknown }).role;
  const content = (value as { content?: unknown }).content;
  return (
    (role === "user" || role === "assistant") &&
    typeof content === "string" &&
    content.trim().length > 0
  );
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<
    | Awaited<ReturnType<typeof runContractChat>>
    | ApiErrorResponse
  >
> {
  try {
    await requirePermission("run_assisted_query");
    const organizationId = await requireOrganizationScope();
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("Se requiere JSON con message.", 400);
    }

    const payload = body as Partial<ContractChatInput>;
    const message = payload.message?.trim();

    if (!message) {
      return jsonError("Se requiere message.", 400);
    }

    const historial = Array.isArray(payload.historial)
      ? payload.historial.filter(isChatMessage)
      : [];

    const contractId =
      typeof payload.contract_id === "string" && payload.contract_id.trim()
        ? payload.contract_id.trim()
        : undefined;

    let extractedText: string | null = null;
    let contractName = payload.contract_name;

    if (contractId) {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("legal_contracts")
        .select(
          "file_name, extracted_text, contract_type, party_a, party_b, starts_at, expires_at, lifecycle_status, contract_metadata, index_quality",
        )
        .eq("id", contractId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error) {
        return jsonError("No se pudo cargar el contrato.", 500, error.message);
      }

      if (!data) {
        return jsonError("Contrato no encontrado.", 404);
      }

      if (data.index_quality === "insufficient_text" || !data.extracted_text) {
        return jsonError(
          "El contrato no tiene texto indexado suficiente para conversar. Aplicá OCR y reindexá.",
          422,
        );
      }

      extractedText = extractMatchingSnippets(data.extracted_text, message, 3).join(
        "\n\n---\n\n",
      );

      if (!extractedText) {
        extractedText = data.extracted_text.slice(0, 3500);
      }

      const metadataContext = [
        data.contract_type ? `Tipo: ${data.contract_type}` : null,
        data.party_a ? `Parte A: ${data.party_a}` : null,
        data.party_b ? `Parte B: ${data.party_b}` : null,
        data.starts_at ? `Inicio: ${data.starts_at}` : null,
        data.expires_at ? `Fin: ${data.expires_at}` : null,
        data.lifecycle_status ? `Estado: ${data.lifecycle_status}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      if (metadataContext) {
        extractedText = `METADATOS DEL EXPEDIENTE:\n${metadataContext}\n\n${extractedText}`;
      }

      const { data: obligationRows } = await supabase
        .from("contract_obligations")
        .select("title, due_at, obligation_type, status")
        .eq("contract_id", contractId)
        .neq("status", "completed")
        .order("due_at", { ascending: true })
        .limit(8);

      if (obligationRows && obligationRows.length > 0) {
        const lines = obligationRows.map(
          (row) =>
            `- [${row.obligation_type}] ${row.title}${row.due_at ? ` (vence: ${row.due_at})` : ""}`,
        );
        extractedText = `OBLIGACIONES PENDIENTES:\n${lines.join("\n")}\n\n${extractedText}`;
      }

      contractName = data.file_name;
    }

    const mode = isQueryMode(payload.mode) ? payload.mode : undefined;

    const response = await runContractChat(
      {
        message,
        mode,
        historial,
        contract_id: contractId,
        contract_name: contractName,
        matches: payload.matches,
      },
      extractedText,
    );

    if (contractId) {
      const profile = await getCurrentProfile();
      await persistContractAiQuery({
        contractId,
        message,
        structured: response.structured,
        respuestaTexto: response.respuesta,
        actorUserId: profile?.id ?? null,
        actorName: profile?.full_name,
        organizationId,
      });

      await logActivity({
        action: "contract.assisted_query",
        entityType: "legal_contract",
        entityId: contractId,
        entityLabel: contractName ?? contractId,
        metadata: {
          modo: response.structured.modo,
          pregunta: message.slice(0, 300),
          respuesta_breve: response.structured.respuesta_breve.slice(0, 400),
          contexto_insuficiente: response.structured.contexto_insuficiente,
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof GroqRateLimitError) {
      return jsonError("Cuota de Groq agotada.", 429, error.message);
    }

    const details = error instanceof Error ? error.message : "Error interno.";
    console.error("[contracts/chat] Unexpected error:", details);
    return jsonError("Error interno del servidor.", 500, details);
  }
}
