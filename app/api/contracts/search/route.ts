import { NextRequest, NextResponse } from "next/server";
import {
  describeAppliedFilters,
  hasStructuralFilters,
  hasTextQuery,
  type ContractRowForSearch,
  parseHybridSearchParams,
  resolveSearchMode,
  runHybridSearchPipeline,
} from "@/lib/contracts/hybrid-search";
import { riesgoToScore, type RiesgoNivel } from "@/lib/contracts/search-intelligence";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, ContractListItem, ContractStatus } from "@/lib/supabase/types";

export interface ContractSearchResponse {
  query: string | null;
  mode: "text" | "filters" | "hybrid";
  matches: import("@/lib/contracts/search-intelligence").ContractSearchMatch[];
  contracts: ContractListItem[];
  heatmap: {
    score: number;
    riesgo: RiesgoNivel;
    coincidencias: number;
  };
  summary: {
    total_contracts: number;
    total_matches: number;
    filters_applied: string[];
  };
}

const SELECT_COLUMNS =
  "id, file_name, client_name, folder_name, status, file_hash, created_at, starts_at, expires_at, contract_type, party_a, party_b, lifecycle_status, extracted_text";

function jsonError(
  error: string,
  status: number,
  details?: string,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status },
  );
}

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
): Promise<NextResponse<ContractSearchResponse | ApiErrorResponse>> {
  const filters = parseHybridSearchParams(request.nextUrl.searchParams);

  if (!hasTextQuery(filters) && !hasStructuralFilters(filters)) {
    return jsonError(
      "Ingresá al menos 2 caracteres o seleccioná un filtro estructural.",
      400,
    );
  }

  const supabase = createServerSupabaseClient();

  let dbQuery = supabase
    .from("legal_contracts")
    .select(SELECT_COLUMNS)
    .is("archived_at", null);

  if (hasTextQuery(filters)) {
    dbQuery = dbQuery.textSearch("search_vector", filters.q!, {
      type: "websearch",
      config: "spanish",
    });
  }

  dbQuery = applyStructuralFilters(dbQuery, filters);

  const orderColumn = filters.sort === "recent" ? "created_at" : "created_at";
  const { data, error } = await dbQuery
    .order(orderColumn, { ascending: false })
    .limit(50);

  if (error) {
    return jsonError("Error en búsqueda.", 500, error.message);
  }

  const rows = (data ?? []) as ContractRowForSearch[];
  const matches = runHybridSearchPipeline(rows, filters);

  const contracts: ContractListItem[] = rows.map(
    ({ extracted_text: _extracted, status, ...contract }) => ({
      ...contract,
      status: status as ContractStatus,
    }),
  );

  const topRiesgo = matches[0]?.riesgo ?? "BAJO";
  const heatmapScore =
    matches.length > 0
      ? Math.round(
          matches.reduce((sum, match) => sum + riesgoToScore(match.riesgo), 0) /
            matches.length,
        )
      : 0;

  return NextResponse.json({
    query: filters.q,
    mode: resolveSearchMode(filters),
    matches,
    contracts,
    heatmap: {
      score: heatmapScore,
      riesgo: topRiesgo,
      coincidencias: matches.length,
    },
    summary: {
      total_contracts: contracts.length,
      total_matches: matches.length,
      filters_applied: describeAppliedFilters(filters),
    },
  });
}
