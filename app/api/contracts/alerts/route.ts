import { NextResponse } from "next/server";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

interface ExpirationAlert {
  id: string;
  file_name: string;
  client_name: string;
  expires_at: string;
  days_remaining: number;
}

export async function GET(): Promise<
  NextResponse<{ alerts: ExpirationAlert[] } | ApiErrorResponse>
> {
  try {
    const organizationId = await requireOrganizationScope();
    const supabase = createServerSupabaseClient();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);

    const { data, error } = await supabase
      .from("legal_contracts")
      .select("id, file_name, client_name, expires_at")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .not("expires_at", "is", null)
      .lte("expires_at", horizon.toISOString())
      .order("expires_at", { ascending: true })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { error: "No se pudieron cargar alertas.", details: error.message },
        { status: 500 },
      );
    }

    const alerts: ExpirationAlert[] = (data ?? []).map((item) => {
      const expiresAt = new Date(item.expires_at as string);
      const daysRemaining = Math.ceil(
        (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      return {
        id: item.id,
        file_name: item.file_name,
        client_name: item.client_name,
        expires_at: item.expires_at as string,
        days_remaining: daysRemaining,
      };
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar alertas.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
