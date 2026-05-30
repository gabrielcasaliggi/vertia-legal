import { NextResponse } from "next/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export function jsonError(
  error: string,
  status: number,
  details?: string,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status },
  );
}

export function jsonUnexpectedError(
  context: string,
  error: unknown,
  fallback = "Error interno del servidor.",
): NextResponse<ApiErrorResponse> {
  const message = error instanceof Error ? error.message : fallback;
  console.error(`[${context}]`, message);
  return jsonError(fallback, 500, message);
}
