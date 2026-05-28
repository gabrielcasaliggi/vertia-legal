import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/contracts/activity-log";
import { buildSearchResultsCsv } from "@/lib/contracts/export";
import {
  hasStructuralFilters,
  hasTextQuery,
  parseHybridSearchParams,
  runHybridSearchPipeline,
  type ContractRowForSearch,
} from "@/lib/contracts/hybrid-search";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

function applyStructuralFilters(
  query: ReturnType<ReturnType<typeof createServerSupabaseClient>["from"]>,
  filters: ReturnType<typeof parseHybridSearchParams>,
) {
  if (filters.client) {
    query = query.eq("client_name", filters.client);
  }
  if (filters.folder) {
    query = query.eq("folder_name", filters.folder);
  }
  if (filters.lifecycle) {
    query = query.eq("lifecycle_status", filters.lifecycle);
  }
  if (filters.contract_type) {
    query = query.ilike("contract_type", `%${filters.contract_type}%`);
  }
  if (filters.document_category) {
    query = query.eq("document_category", filters.document_category);
  }
  if (filters.party) {
    const escaped = filters.party.replace(/[%_,]/g, " ").trim();
    const term = `%${escaped}%`;
    query = query.or(`party_a.ilike.${term},party_b.ilike.${term}`);
  }
  if (filters.expires_before) {
    query = query.lte("expires_at", filters.expires_before);
  }
  if (filters.expires_after) {
    query = query.gte("expires_at", filters.expires_after);
  }
  return query;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiErrorResponse | BodyInit>> {
  const filters = parseHybridSearchParams(request.nextUrl.searchParams);

  if (!hasTextQuery(filters) && !hasStructuralFilters(filters)) {
    return NextResponse.json(
      { error: "Aplicá criterios de búsqueda antes de exportar." },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();

  let dbQuery = supabase
    .from("legal_contracts")
    .select(
      "id, file_name, client_name, folder_name, status, file_hash, created_at, starts_at, expires_at, contract_type, party_a, party_b, lifecycle_status, extracted_text",
    )
    .is("archived_at", null);

  if (hasTextQuery(filters)) {
    dbQuery = dbQuery.textSearch("search_vector", filters.q!, {
      type: "websearch",
      config: "spanish",
    });
  }

  dbQuery = applyStructuralFilters(dbQuery, filters);

  const { data, error } = await dbQuery.order("created_at", { ascending: false }).limit(100);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo exportar.", details: error.message },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as ContractRowForSearch[];
  const matches = runHybridSearchPipeline(rows, filters);
  const csv = buildSearchResultsCsv(matches);
  const filename = `vertia-busqueda-${new Date().toISOString().slice(0, 10)}.csv`;

  await logActivity({
    action: "search.exported",
    entityType: "search",
    entityLabel: filename,
    metadata: { matches: matches.length },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
