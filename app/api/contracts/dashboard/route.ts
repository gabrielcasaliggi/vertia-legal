import { NextResponse } from "next/server";
import {
  buildExecutiveDashboardStats,
  type DashboardContractRow,
} from "@/lib/contracts/executive-dashboard";
import { parseContractAnalysisResult } from "@/lib/contracts/analysis";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(): Promise<
  NextResponse<{ stats: ReturnType<typeof buildExecutiveDashboardStats> } | ApiErrorResponse>
> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("legal_contracts")
    .select(
      "id, file_name, client_name, folder_name, status, lifecycle_status, expires_at, analysis_result, created_at",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el dashboard.", details: error.message },
      { status: 500 },
    );
  }

  const rows: DashboardContractRow[] = (data ?? []).map((row) => ({
    id: row.id,
    file_name: row.file_name,
    client_name: row.client_name,
    folder_name: row.folder_name,
    status: row.status,
    lifecycle_status: row.lifecycle_status,
    expires_at: row.expires_at,
    analysis_result: parseContractAnalysisResult(row.analysis_result),
    created_at: row.created_at,
  }));

  return NextResponse.json({ stats: buildExecutiveDashboardStats(rows) });
}
