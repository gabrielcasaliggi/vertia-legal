import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createOrganizationOwner } from "@/lib/platform/organizations";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<
    { owner: Awaited<ReturnType<typeof createOrganizationOwner>> } | ApiErrorResponse
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
      email?: string;
      password?: string;
      full_name?: string;
    };

    const email = payload.email?.trim();
    const password = payload.password;
    const fullName = payload.full_name?.trim() || email?.split("@")[0] || "Administrador";

    if (!email || !password || password.length < 8) {
      return jsonError("Email y contraseña (mín. 8 caracteres) son obligatorios.", 400);
    }

    const owner = await createOrganizationOwner(actor, id, {
      email,
      password,
      full_name: fullName,
    });

    return NextResponse.json({ owner }, { status: 201 });
  } catch (error) {
    return jsonUnexpectedError("platform/organizations owner POST", error, "No se pudo crear el owner.");
  }
}
