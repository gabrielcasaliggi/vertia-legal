import { NextRequest, NextResponse } from "next/server";
import { fetchContractAiQueries } from "@/lib/contracts/contract-ai-queries";
import { fetchContractAssistedQueries } from "@/lib/contracts/assisted-query-history";
import { jsonError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<{ entries: unknown[] } | ApiErrorResponse>> {
  try {
    const { id } = await context.params;
    const contractId = id.trim();

    if (!contractId) {
      return jsonError("ID de contrato inválido.", 400);
    }

    try {
      const entries = await fetchContractAiQueries(contractId);
      if (entries.length > 0) {
        return NextResponse.json({ entries });
      }
    } catch {
      // fallback a activity_log si la tabla nueva aún no existe
    }

    const legacy = await fetchContractAssistedQueries(contractId);
    return NextResponse.json({ entries: legacy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar historial.";
    return jsonError(message, 500);
  }
}
