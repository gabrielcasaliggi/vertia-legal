import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, ContractListItem } from "@/lib/supabase/types";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<{ contracts: ContractListItem[] } | ApiErrorResponse>> {
  const supabase = createServerSupabaseClient();
  const clientName = request.nextUrl.searchParams.get("client_name");
  const folderName = request.nextUrl.searchParams.get("folder_name");

  let query = supabase
    .from("legal_contracts")
    .select(
      "id, file_name, client_name, folder_name, status, file_hash, created_at, starts_at, expires_at, contract_type, party_a, party_b, lifecycle_status",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (clientName) {
    query = query.eq("client_name", clientName);
  }

  if (folderName) {
    query = query.eq("folder_name", folderName);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "No se pudo listar contratos.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ contracts: data ?? [] });
}
