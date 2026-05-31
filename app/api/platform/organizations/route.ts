import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import {
  createPlatformOrganization,
  listPlatformOrganizations,
  type OrganizationPlan,
  type OrganizationStatus,
} from "@/lib/platform/organizations";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

const STATUSES: OrganizationStatus[] = ["trial", "active", "suspended", "cancelled"];
const PLANS: OrganizationPlan[] = ["pilot", "professional", "enterprise"];

export async function GET(): Promise<
  NextResponse<{ organizations: Awaited<ReturnType<typeof listPlatformOrganizations>> } | ApiErrorResponse>
> {
  try {
    await requirePlatformAdmin();
    const organizations = await listPlatformOrganizations();
    return NextResponse.json({ organizations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar organizaciones.";
    const status = message.includes("plataforma") || message.includes("autorizado") ? 403 : 500;
    return jsonError(message, status);
  }
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<
    { organization: Awaited<ReturnType<typeof createPlatformOrganization>> } | ApiErrorResponse
  >
> {
  try {
    const actor = await requirePlatformAdmin();
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("JSON inválido.", 400);
    }

    const payload = body as {
      name?: string;
      slug?: string;
      plan?: string;
      status?: string;
      billing_email?: string | null;
      trial_ends_at?: string | null;
    };

    const name = payload.name?.trim();
    if (!name) {
      return jsonError("El nombre es obligatorio.", 400);
    }

    const plan = PLANS.includes(payload.plan as OrganizationPlan)
      ? (payload.plan as OrganizationPlan)
      : "pilot";
    const status = STATUSES.includes(payload.status as OrganizationStatus)
      ? (payload.status as OrganizationStatus)
      : "trial";

    const organization = await createPlatformOrganization(actor, {
      name,
      slug: payload.slug?.trim() || name,
      plan,
      status,
      billing_email: payload.billing_email ?? null,
      trial_ends_at: payload.trial_ends_at ?? null,
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    return jsonUnexpectedError("platform/organizations POST", error, "No se pudo crear la organización.");
  }
}
