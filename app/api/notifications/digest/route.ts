import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/roles";
import {
  getNotificationConfig,
  isCronAuthorized,
  isSmtpConfigured,
} from "@/lib/notifications/config";
import { gatherNotificationDigest } from "@/lib/notifications/gather-digest";
import { sendNotificationDigest } from "@/lib/notifications/send-digest";
import { getCurrentOrganizationId } from "@/lib/auth/organization";
import type { ApiErrorResponse } from "@/lib/supabase/types";

function jsonError(error: string, status: number, details?: string) {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status },
  );
}

async function authorizeRequest(request: NextRequest): Promise<
  | { ok: true; via: "cron" | "admin" }
  | { ok: false; response: NextResponse<ApiErrorResponse> }
> {
  const config = getNotificationConfig();

  if (isCronAuthorized(request.headers.get("authorization"), config)) {
    return { ok: true, via: "cron" };
  }

  const profile = await getCurrentProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return {
      ok: false,
      response: jsonError("Solo administradores pueden gestionar notificaciones.", 403),
    };
  }

  return { ok: true, via: "admin" };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<unknown | ApiErrorResponse>> {
  const auth = await authorizeRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const config = getNotificationConfig();
    const organizationId = await getCurrentOrganizationId();
    const digest = await gatherNotificationDigest(config, organizationId);

    return NextResponse.json({
      digest,
      smtp_configured: isSmtpConfigured(config),
      recipients_configured: config.digestRecipients,
      via: auth.via,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno.";
    return jsonError("No se pudo generar la vista previa.", 500, message);
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<unknown | ApiErrorResponse>> {
  const auth = await authorizeRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  let force = false;
  let dryRun = false;

  try {
    const body: unknown = await request.json().catch(() => null);
    if (typeof body === "object" && body !== null) {
      const payload = body as { force?: boolean; dry_run?: boolean };
      force = payload.force === true;
      dryRun = payload.dry_run === true;
    }
  } catch {
    // cuerpo vacío permitido (cron)
  }

  const forceFromQuery = request.nextUrl.searchParams.get("force") === "1";
  if (forceFromQuery) {
    force = true;
  }

  try {
    const organizationId = await getCurrentOrganizationId();
    const summary = await sendNotificationDigest({ force, dryRun, organizationId });
    return NextResponse.json({ ...summary, via: auth.via });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno.";
    return jsonError("No se pudo enviar el resumen.", 500, message);
  }
}
