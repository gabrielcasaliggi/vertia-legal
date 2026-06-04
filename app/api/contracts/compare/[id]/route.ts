import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import { fetchContractComparisonById } from "@/lib/contracts/contract-comparisons";
import { jsonError } from "@/lib/http/json-error";
import type { ContractComparisonResponse } from "@/lib/contracts/compare";
import type { ApiErrorResponse } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse<ContractComparisonResponse | ApiErrorResponse>> {
  try {
    await requirePermission("run_audit");
    const { id } = await context.params;
    const organizationId = await requireOrganizationScope();
    const comparison = await fetchContractComparisonById(id, organizationId);

    if (!comparison) {
      return jsonError("Comparación no encontrada.", 404);
    }

    return NextResponse.json(comparison);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar la comparación.";
    return jsonError(message, 500);
  }
}
