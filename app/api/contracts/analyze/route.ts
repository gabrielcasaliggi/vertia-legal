import { NextRequest, NextResponse } from "next/server";
import {
  runContractAnalysis,
  ContractAnalysisError,
} from "@/lib/contracts/run-analysis";
import { requirePermission } from "@/lib/auth/require-permission";
import { GroqRateLimitError } from "@/lib/groq/errors";
import type { AnalyzeContractResponse } from "@/lib/contracts/analysis";
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AnalyzeContractResponse | ApiErrorResponse>> {
  try {
    await requirePermission("run_audit");
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("Se requiere JSON con contract_id.", 400);
    }

    const contractId = (body as { contract_id?: unknown }).contract_id;

    if (typeof contractId !== "string" || contractId.trim().length === 0) {
      return jsonError("Se requiere contract_id válido.", 400);
    }

    const analysis = await runContractAnalysis(contractId.trim());

    return NextResponse.json(
      {
        contract_id: contractId.trim(),
        status: "analyzed",
        analysis,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof GroqRateLimitError) {
      return jsonError("Cuota de Groq agotada.", 429, error.message);
    }

    if (error instanceof ContractAnalysisError) {
      const status = error.message.includes("No se encontró") ? 404 : 502;
      return jsonError(error.message, status, error.message);
    }

    const message =
      error instanceof Error ? error.message : "Error interno del servidor.";
    console.error("[contracts/analyze] Unexpected error:", message);
    return jsonError("Error interno del servidor.", 500, message);
  }
}
