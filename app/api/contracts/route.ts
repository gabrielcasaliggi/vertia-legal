import { NextRequest, NextResponse } from "next/server";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, ContractListItem } from "@/lib/supabase/types";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<{ contracts: ContractListItem[] } | ApiErrorResponse>> {
  const supabase = createServerSupabaseClient();
  let organizationId: string;
  try {
    organizationId = await requireOrganizationScope();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Organización no disponible.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
  const clientName = request.nextUrl.searchParams.get("client_name");
  const folderName = request.nextUrl.searchParams.get("folder_name");

  let query = supabase
    .from("legal_contracts")
    .select(
      "id, file_name, client_name, folder_name, status, file_hash, created_at, starts_at, expires_at, contract_type, party_a, party_b, lifecycle_status",
    )
    .eq("organization_id", organizationId)
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
