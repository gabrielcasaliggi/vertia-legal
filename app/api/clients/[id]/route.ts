import { NextRequest, NextResponse } from "next/server";
import { getClient360 } from "@/lib/clients/client-360-service";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<Awaited<ReturnType<typeof getClient360>> | ApiErrorResponse>> {
  try {
    const { id } = await context.params;
    const payload = await getClient360(id);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar cliente.";
    const status = message.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
