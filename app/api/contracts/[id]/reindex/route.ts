import { NextRequest, NextResponse } from "next/server";
import { reindexContractFromStorage } from "@/lib/contracts/reindex-contract";
import { logActivity } from "@/lib/contracts/activity-log";
import { getCurrentProfile } from "@/lib/auth/session";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";
import { LocalExtractionError } from "@/lib/pdf/extract-local";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<{ extractedLength: number } | ApiErrorResponse>
> {
  try {
    const { id } = await context.params;
    const profile = await getCurrentProfile();
    const result = await reindexContractFromStorage(id);

    await logActivity({
      action: "contract.updated",
      entityType: "legal_contract",
      entityId: id,
      entityLabel: "Reindexación manual",
      actorName: profile?.full_name,
      metadata: { extractedLength: result.extractedLength },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof LocalExtractionError) {
      return jsonError("No se pudo reindexar el PDF.", 422, error.message);
    }
    return jsonUnexpectedError("contracts/reindex", error, "Error al reindexar.");
  }
}
