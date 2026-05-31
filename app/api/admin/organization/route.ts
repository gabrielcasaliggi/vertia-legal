import { NextRequest, NextResponse } from "next/server";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "@/lib/organizations/settings";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(): Promise<
  NextResponse<{ organization: Awaited<ReturnType<typeof getOrganizationSettings>> } | ApiErrorResponse>
> {
  try {
    await requireAdminProfile();
    const organizationId = await requireOrganizationScope();
    const organization = await getOrganizationSettings(organizationId);
    return NextResponse.json({ organization });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar organización.";
    const status = message.includes("administrador") || message.includes("autorizado") ? 403 : 500;
    return jsonError(message, status);
  }
}

export async function PATCH(
  request: NextRequest,
): Promise<
  NextResponse<{ organization: Awaited<ReturnType<typeof updateOrganizationSettings>> } | ApiErrorResponse>
> {
  try {
    await requireAdminProfile();
    const organizationId = await requireOrganizationScope();
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("JSON inválido.", 400);
    }

    const payload = body as {
      name?: string;
      contact_email?: string | null;
      contact_phone?: string | null;
      logo_url?: string | null;
      report_disclaimer?: string | null;
      report_responsible_name?: string | null;
    };

    const organization = await updateOrganizationSettings(organizationId, payload);
    return NextResponse.json({ organization });
  } catch (error) {
    return jsonUnexpectedError("admin/organization PATCH", error, "No se pudo actualizar.");
  }
}
