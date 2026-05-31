import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import {
  getPlatformOrganization,
  updatePlatformOrganization,
  type OrganizationPlan,
  type OrganizationStatus,
} from "@/lib/platform/organizations";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

const STATUSES: OrganizationStatus[] = ["trial", "active", "suspended", "cancelled"];
const PLANS: OrganizationPlan[] = ["pilot", "professional", "enterprise"];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<{ organization: NonNullable<Awaited<ReturnType<typeof getPlatformOrganization>>> } | ApiErrorResponse>
> {
  try {
    await requirePlatformAdmin();
    const { id } = await context.params;
    const organization = await getPlatformOrganization(id);
    if (!organization) {
      return jsonError("Organización no encontrada.", 404);
    }
    return NextResponse.json({ organization });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar organización.";
    const status = message.includes("plataforma") || message.includes("autorizado") ? 403 : 500;
    return jsonError(message, status);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<
    { organization: Awaited<ReturnType<typeof updatePlatformOrganization>> } | ApiErrorResponse
  >
> {
  try {
    const actor = await requirePlatformAdmin();
    const { id } = await context.params;
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("JSON inválido.", 400);
    }

    const payload = body as {
      name?: string;
      plan?: string;
      status?: string;
      billing_email?: string | null;
      trial_ends_at?: string | null;
    };

    const organization = await updatePlatformOrganization(actor, id, {
      name: payload.name,
      plan: PLANS.includes(payload.plan as OrganizationPlan)
        ? (payload.plan as OrganizationPlan)
        : undefined,
      status: STATUSES.includes(payload.status as OrganizationStatus)
        ? (payload.status as OrganizationStatus)
        : undefined,
      billing_email: payload.billing_email,
      trial_ends_at: payload.trial_ends_at,
    });

    return NextResponse.json({ organization });
  } catch (error) {
    return jsonUnexpectedError("platform/organizations PATCH", error, "No se pudo actualizar.");
  }
}
