import { NextRequest, NextResponse } from "next/server";
import { updateStudioUser } from "@/lib/auth/admin-users";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import { isUserRole } from "@/lib/auth/roles";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<
  NextResponse<{ user: Awaited<ReturnType<typeof updateStudioUser>> } | ApiErrorResponse>
> {
  try {
    await requireAdminProfile();
    const organizationId = await requireOrganizationScope();
    const { id } = await context.params;
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("JSON inválido.", 400);
    }

    const payload = body as {
      full_name?: string;
      role?: string;
      is_active?: boolean;
    };

    const user = await updateStudioUser(id, {
      ...(payload.full_name !== undefined ? { full_name: payload.full_name.trim() } : {}),
      ...(payload.role !== undefined && isUserRole(payload.role)
        ? { role: payload.role }
        : {}),
      ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
    }, organizationId);

    return NextResponse.json({ user });
  } catch (error) {
    return jsonUnexpectedError("admin/users PATCH", error, "No se pudo actualizar el usuario.");
  }
}
