import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACTIVE_ORG_COOKIE,
  listUserOrganizations,
} from "@/lib/auth/active-organization";
import { requireCurrentProfile } from "@/lib/auth/session";
import { jsonError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(): Promise<
  NextResponse<
    { organizations: Awaited<ReturnType<typeof listUserOrganizations>> } | ApiErrorResponse
  >
> {
  try {
    await requireCurrentProfile();
    const organizations = await listUserOrganizations();
    return NextResponse.json({ organizations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado.";
    return jsonError(message, 401);
  }
}

export async function POST(request: NextRequest): Promise<
  NextResponse<{ organization_id: string } | ApiErrorResponse>
> {
  try {
    await requireCurrentProfile();
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("JSON inválido.", 400);
    }

    const organizationId = (body as { organization_id?: string }).organization_id?.trim();
    if (!organizationId) {
      return jsonError("organization_id es obligatorio.", 400);
    }

    const memberships = await listUserOrganizations();
    if (!memberships.some((membership) => membership.id === organizationId)) {
      return jsonError("No tenés acceso a esa organización.", 403);
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ organization_id: organizationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado.";
    return jsonError(message, 401);
  }
}
