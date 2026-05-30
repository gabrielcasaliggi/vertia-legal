import { NextResponse } from "next/server";
import { listStudioUsers } from "@/lib/auth/admin-users";
import { jsonError } from "@/lib/http/json-error";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(): Promise<
  NextResponse<
    { assignees: Array<{ id: string; full_name: string; email: string }> } | ApiErrorResponse
  >
> {
  try {
    const users = await listStudioUsers();
    return NextResponse.json({
      assignees: users
        .filter((user) => user.is_active)
        .map((user) => ({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
        })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar usuarios.";
    return jsonError(message, 500);
  }
}
