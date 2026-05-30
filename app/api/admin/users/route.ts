import { NextRequest, NextResponse } from "next/server";
import {
  createStudioUser,
  listStudioUsers,
} from "@/lib/auth/admin-users";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { isUserRole } from "@/lib/auth/roles";
import { jsonError, jsonUnexpectedError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(): Promise<
  NextResponse<{ users: Awaited<ReturnType<typeof listStudioUsers>> } | ApiErrorResponse>
> {
  try {
    await requireAdminProfile();
    const users = await listStudioUsers();
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar usuarios.";
    const status = message.includes("administrador") || message.includes("autorizado") ? 403 : 500;
    return jsonError(message, status);
  }
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<{ user: Awaited<ReturnType<typeof createStudioUser>> } | ApiErrorResponse>
> {
  try {
    await requireAdminProfile();
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return jsonError("JSON inválido.", 400);
    }

    const payload = body as {
      email?: string;
      password?: string;
      full_name?: string;
      role?: string;
    };

    const email = payload.email?.trim();
    const password = payload.password;
    const fullName = payload.full_name?.trim() || email?.split("@")[0] || "Usuario";
    const role = payload.role && isUserRole(payload.role) ? payload.role : "assistant";

    if (!email || !password || password.length < 8) {
      return jsonError("Email y contraseña (mín. 8 caracteres) son obligatorios.", 400);
    }

    const user = await createStudioUser({
      email,
      password,
      full_name: fullName,
      role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return jsonUnexpectedError("admin/users POST", error, "No se pudo crear el usuario.");
  }
}
