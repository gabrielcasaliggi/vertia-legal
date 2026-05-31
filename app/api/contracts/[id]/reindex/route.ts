import { NextRequest, NextResponse } from "next/server";
import { reindexContractFromStorage } from "@/lib/contracts/reindex-contract";
import { logActivity } from "@/lib/contracts/activity-log";
import { requirePermission } from "@/lib/auth/require-permission";
import { getCurrentProfile } from "@/lib/auth/session";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<{ extractedLength: number; index_quality: string; index_warning: string | null } | ApiErrorResponse>
> {
  try {
    await requirePermission("reindex_contract");
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
    const message = error instanceof Error ? error.message : "Error al reindexar.";
    const status = message.includes("permiso") ? 403 : 500;
    if (status === 403) {
      return jsonError(message, 403);
    }
    return jsonUnexpectedError("contracts/reindex", error, "Error al reindexar.");
  }
}
