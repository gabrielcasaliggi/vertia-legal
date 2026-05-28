import { NextRequest, NextResponse } from "next/server";
import {
  computeDaysUntilDue,
  computeObligationStatus,
  type ObligationListItem,
  type ObligationStatus,
  type ObligationType,
} from "@/lib/contracts/obligations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, Database } from "@/lib/supabase/types";

type ObligationUpdate = Database["public"]["Tables"]["contract_obligations"]["Update"];

const OBLIGATION_TYPES: ObligationType[] = [
  "general",
  "payment",
  "renewal",
  "notice",
  "compliance",
];

const OBLIGATION_STATUSES: ObligationStatus[] = ["pending", "completed", "overdue"];

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ obligation: ObligationListItem } | ApiErrorResponse>> {
  const { id } = await context.params;

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
  const update: ObligationUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (typeof payload.title === "string" && payload.title.trim()) {
    update.title = payload.title.trim();
  }

  if ("due_at" in payload) {
    if (payload.due_at === null || payload.due_at === "") {
      update.due_at = null;
    } else if (typeof payload.due_at === "string") {
      update.due_at = new Date(`${payload.due_at.trim()}T12:00:00.000Z`).toISOString();
    }
  }

  if (
    typeof payload.obligation_type === "string" &&
    OBLIGATION_TYPES.includes(payload.obligation_type as ObligationType)
  ) {
    update.obligation_type = payload.obligation_type as ObligationType;
  }

  if (
    typeof payload.status === "string" &&
    OBLIGATION_STATUSES.includes(payload.status as ObligationStatus)
  ) {
    update.status = payload.status as ObligationStatus;
  }

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("contract_obligations")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return jsonError("No se pudo actualizar la obligación.", 500, error?.message);
  }

  const { data: contract } = await supabase
    .from("legal_contracts")
    .select("file_name, client_name")
    .eq("id", data.contract_id)
    .single();

  const obligation: ObligationListItem = {
    id: data.id,
    contract_id: data.contract_id,
    title: data.title,
    due_at: data.due_at,
    obligation_type: data.obligation_type,
    status: computeObligationStatus(data.status, data.due_at),
    source: data.source,
    created_at: data.created_at,
    updated_at: data.updated_at,
    file_name: contract?.file_name ?? "Expediente",
    client_name: contract?.client_name ?? "General",
    days_remaining: computeDaysUntilDue(data.due_at),
  };

  return NextResponse.json({ obligation });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ ok: true } | ApiErrorResponse>> {
  const { id } = await context.params;
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("contract_obligations").delete().eq("id", id);

  if (error) {
    return jsonError("No se pudo eliminar la obligación.", 500, error.message);
  }

  return NextResponse.json({ ok: true });
}
