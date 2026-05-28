import { NextRequest, NextResponse } from "next/server";
import {
  computeDaysUntilDue,
  computeObligationStatus,
  type ObligationListItem,
  type ObligationType,
} from "@/lib/contracts/obligations";
import { refreshOverdueObligationStatuses } from "@/lib/contracts/obligations-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

const OBLIGATION_TYPES: ObligationType[] = [
  "general",
  "payment",
  "renewal",
  "notice",
  "compliance",
];

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

export async function GET(
  request: NextRequest,
): Promise<NextResponse<{ obligations: ObligationListItem[] } | ApiErrorResponse>> {
  const contractId = request.nextUrl.searchParams.get("contract_id")?.trim() || null;
  const horizonDays = Number.parseInt(
    request.nextUrl.searchParams.get("days") ?? "90",
    10,
  );

  await refreshOverdueObligationStatuses(contractId ?? undefined);

  const supabase = createServerSupabaseClient();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + (Number.isNaN(horizonDays) ? 90 : horizonDays));

  let query = supabase
    .from("contract_obligations")
    .select("*")
    .neq("status", "completed")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(40);

  if (contractId) {
    query = query.eq("contract_id", contractId);
  }

  const { data: rows, error } = await query;

  if (error) {
    return jsonError("No se pudieron cargar obligaciones.", 500, error.message);
  }

  const obligationRows = rows ?? [];
  const contractIds = [...new Set(obligationRows.map((row) => row.contract_id))];

  const { data: contracts } = contractIds.length
    ? await supabase
        .from("legal_contracts")
        .select("id, file_name, client_name, archived_at")
        .in("id", contractIds)
    : { data: [] };

  const contractMap = new Map(
    (contracts ?? []).map((contract) => [contract.id, contract]),
  );

  const obligations: ObligationListItem[] = obligationRows
    .map((row) => {
      const contract = contractMap.get(row.contract_id);
      if (!contract || contract.archived_at) {
        return null;
      }

      if (
        !contractId &&
        row.due_at &&
        new Date(row.due_at).getTime() > horizon.getTime()
      ) {
        return null;
      }

      return {
        id: row.id,
        contract_id: row.contract_id,
        title: row.title,
        due_at: row.due_at,
        obligation_type: row.obligation_type,
        status: computeObligationStatus(row.status, row.due_at),
        source: row.source,
        created_at: row.created_at,
        updated_at: row.updated_at,
        file_name: contract.file_name,
        client_name: contract.client_name,
        days_remaining: computeDaysUntilDue(row.due_at),
      };
    })
    .filter((item): item is ObligationListItem => item !== null);

  return NextResponse.json({ obligations });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ obligation: ObligationListItem } | ApiErrorResponse>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Se requiere JSON válido.", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("Cuerpo inválido.", 400);
  }

  const payload = body as Record<string, unknown>;
  const contractId =
    typeof payload.contract_id === "string" ? payload.contract_id.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";

  if (!contractId || !title) {
    return jsonError("Se requieren contract_id y title.", 400);
  }

  const obligationType =
    typeof payload.obligation_type === "string" &&
    OBLIGATION_TYPES.includes(payload.obligation_type as ObligationType)
      ? (payload.obligation_type as ObligationType)
      : "general";

  let dueAt: string | null = null;
  if (typeof payload.due_at === "string" && payload.due_at.trim()) {
    dueAt = new Date(`${payload.due_at.trim()}T12:00:00.000Z`).toISOString();
  }

  const supabase = createServerSupabaseClient();

  const { data: contract, error: contractError } = await supabase
    .from("legal_contracts")
    .select("id, file_name, client_name, archived_at")
    .eq("id", contractId)
    .maybeSingle();

  if (contractError || !contract || contract.archived_at) {
    return jsonError("Contrato no encontrado o archivado.", 404);
  }

  const { data, error } = await supabase
    .from("contract_obligations")
    .insert({
      contract_id: contractId,
      title,
      due_at: dueAt,
      obligation_type: obligationType,
      source: "manual",
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    return jsonError("No se pudo crear la obligación.", 500, error?.message);
  }

  const obligation: ObligationListItem = {
    ...data,
    file_name: contract.file_name,
    client_name: contract.client_name,
    days_remaining: computeDaysUntilDue(data.due_at),
  };

  return NextResponse.json({ obligation }, { status: 201 });
}
