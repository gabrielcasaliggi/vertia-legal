import { NextRequest, NextResponse } from "next/server";
import { fetchContractAssistedQueries } from "@/lib/contracts/assisted-query-history";
import type { ApiErrorResponse } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<
    { entries: Awaited<ReturnType<typeof fetchContractAssistedQueries>> } | ApiErrorResponse
  >
> {
  try {
    const { id } = await context.params;
    const contractId = id.trim();

    if (!contractId) {
      return NextResponse.json({ error: "ID de contrato inválido." }, { status: 400 });
    }

    const entries = await fetchContractAssistedQueries(contractId);
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar historial.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
