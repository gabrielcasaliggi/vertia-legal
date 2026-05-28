import { NextResponse } from "next/server";
import { fetchRecentActivity } from "@/lib/contracts/activity-log";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(): Promise<
  NextResponse<{ entries: Awaited<ReturnType<typeof fetchRecentActivity>> } | ApiErrorResponse>
> {
  try {
    const entries = await fetchRecentActivity(40);
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar actividad.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
