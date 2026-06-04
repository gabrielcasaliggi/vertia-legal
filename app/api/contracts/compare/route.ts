import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import {
  fetchContractComparisons,
  type ContractComparisonListItem,
} from "@/lib/contracts/contract-comparisons";
import {
  ContractComparisonError,
  runContractComparison,
} from "@/lib/contracts/run-comparison";
import { GroqRateLimitError } from "@/lib/groq/errors";
import type { ContractComparisonResponse } from "@/lib/contracts/compare";
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

export async function GET(
  request: NextRequest,
): Promise<NextResponse<{ comparisons: ContractComparisonListItem[] } | ApiErrorResponse>> {
  try {
    await requirePermission("run_audit");
    const organizationId = await requireOrganizationScope();
    const contractId = request.nextUrl.searchParams.get("contract_id") ?? undefined;
    const comparisons = await fetchContractComparisons(organizationId, 12, contractId);
    return NextResponse.json({ comparisons });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar historial de comparaciones.";
    return jsonError(message, 500);
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ContractComparisonResponse | ApiErrorResponse>> {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("Se requiere JSON con base_contract_id y compared_contract_id.", 400);
    }

    const baseContractId = (body as { base_contract_id?: unknown }).base_contract_id;
    const comparedContractId = (body as { compared_contract_id?: unknown })
      .compared_contract_id;

    if (typeof baseContractId !== "string" || typeof comparedContractId !== "string") {
      return jsonError("Se requieren dos IDs de contrato válidos.", 400);
    }

    const comparison = await runContractComparison({
      baseContractId,
      comparedContractId,
    });

    return NextResponse.json(comparison, { status: 200 });
  } catch (error) {
    if (error instanceof GroqRateLimitError) {
      return jsonError("Cuota de Groq agotada.", 429, error.message);
    }

    if (error instanceof ContractComparisonError) {
      const status = error.message.includes("No se encontraron") ? 404 : 400;
      return jsonError(error.message, status, error.message);
    }

    const message =
      error instanceof Error ? error.message : "Error interno del servidor.";
    console.error("[contracts/compare] Unexpected error:", message);
    return jsonError("Error interno del servidor.", 500, message);
  }
}
