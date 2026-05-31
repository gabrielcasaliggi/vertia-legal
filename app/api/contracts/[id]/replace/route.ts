import { NextRequest, NextResponse } from "next/server";
import { replaceContractPdf } from "@/lib/contracts/reindex-contract";
import { requirePermission } from "@/lib/auth/require-permission";
import { getCurrentProfile } from "@/lib/auth/session";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import { logActivity } from "@/lib/contracts/activity-log";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

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
  NextResponse<
    | {
        version_number: number;
        index_quality: string;
        index_warning: string | null;
      }
    | ApiErrorResponse
  >
> {
  try {
    await requirePermission("replace_contract_pdf");
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
    const organizationId = await requireOrganizationScope();

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
    const message = error instanceof Error ? error.message : "Error al reemplazar PDF.";
    const status = message.includes("permiso") ? 403 : 500;
    if (status === 403) {
      return jsonError(message, 403);
    }
    return jsonUnexpectedError("contracts/replace", error, "Error al reemplazar PDF.");
  }
}
