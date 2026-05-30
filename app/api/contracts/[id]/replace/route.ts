import { NextRequest, NextResponse } from "next/server";
import { replaceContractPdf } from "@/lib/contracts/reindex-contract";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCurrentOrganizationId } from "@/lib/auth/organization";
import { logActivity } from "@/lib/contracts/activity-log";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";
import { LocalExtractionError } from "@/lib/pdf/extract-local";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = process.env.VERCEL ? 4 * 1024 * 1024 : 10 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<{ version_number: number } | ApiErrorResponse>
> {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return jsonError("Se requiere archivo PDF.", 400);
    }

    if (fileEntry.size === 0 || fileEntry.size > MAX_BYTES) {
      return jsonError("PDF vacío o demasiado grande.", 400);
    }

    const profile = await getCurrentProfile();
    const organizationId = await getCurrentOrganizationId();

    const result = await replaceContractPdf(
      id,
      fileEntry,
      profile ? { id: profile.id, name: profile.full_name } : undefined,
      organizationId,
    );

    await logActivity({
      action: "contract.updated",
      entityType: "legal_contract",
      entityId: id,
      entityLabel: fileEntry.name,
      actorName: profile?.full_name,
      metadata: { version_number: result.version_number },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof LocalExtractionError) {
      return jsonError("No se pudo indexar el PDF reemplazado.", 422, error.message);
    }
    return jsonUnexpectedError("contracts/replace", error, "Error al reemplazar PDF.");
  }
}
