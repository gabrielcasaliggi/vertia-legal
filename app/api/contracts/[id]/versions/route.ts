import { NextRequest, NextResponse } from "next/server";
import { fetchContractVersions } from "@/lib/contracts/contract-versions";
import { jsonError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<{ versions: Awaited<ReturnType<typeof fetchContractVersions>> } | ApiErrorResponse>
> {
  try {
    const { id } = await context.params;
    const versions = await fetchContractVersions(id);
    return NextResponse.json({ versions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar versiones.";
    return jsonError(message, 500);
  }
}
