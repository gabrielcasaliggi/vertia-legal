import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/contracts/activity-log";
import {
  assertContractInOrganization,
  requireOrganizationScope,
} from "@/lib/auth/tenant-scope";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  buildPersistedUpdate,
  parseContractUpdateBody,
} from "@/lib/contracts/contract-update";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, LegalContract } from "@/lib/supabase/types";

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
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ contract: LegalContract } | ApiErrorResponse>> {
  try {
    const organizationId = await requireOrganizationScope();
    const { id } = await context.params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("legal_contracts")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      return jsonError("No se pudo cargar el contrato.", 500, error.message);
    }

    if (!data) {
      return jsonError("Contrato no encontrado.", 404);
    }

    return NextResponse.json({ contract: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado.";
    return jsonError(message, 403);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ contract: LegalContract } | ApiErrorResponse>> {
  try {
    await requirePermission("edit_contract_metadata");
    const organizationId = await requireOrganizationScope();
    const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Se requiere JSON válido.", 400);
  }

  const supabase = createServerSupabaseClient();
  await assertContractInOrganization(supabase, id, organizationId);

  const { data: current, error: fetchError } = await supabase
    .from("legal_contracts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError) {
    return jsonError("No se pudo cargar el contrato.", 500, fetchError.message);
  }

  if (!current) {
    return jsonError("Contrato no encontrado.", 404);
  }

  if (typeof body === "object" && body !== null && (body as { unarchive?: unknown }).unarchive === true) {
    const { data, error } = await supabase
      .from("legal_contracts")
      .update({ archived_at: null })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError("No se pudo restaurar el contrato.", 500, error?.message);
    }

    return NextResponse.json({ contract: data });
  }

  const parsed = parseContractUpdateBody(body);
  if (!parsed) {
    return jsonError("No se recibieron campos válidos para actualizar.", 400);
  }

  const updatePayload = buildPersistedUpdate(parsed, {
    starts_at: current.starts_at,
    expires_at: current.expires_at,
  });

  const { data, error } = await supabase
    .from("legal_contracts")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return jsonError("No se pudo actualizar el contrato.", 500, error?.message);
  }

  const actorName =
    typeof body === "object" && body !== null && typeof (body as { actor_name?: unknown }).actor_name === "string"
      ? (body as { actor_name: string }).actor_name
      : undefined;

  await logActivity({
    action: "contract.updated",
    entityType: "legal_contract",
    entityId: id,
    entityLabel: data.file_name,
    actorName,
  });

  return NextResponse.json({ contract: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado.";
    const status = message.includes("permiso") ? 403 : 500;
    return jsonError(message, status);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ contract: LegalContract } | ApiErrorResponse>> {
  try {
    await requirePermission("archive_contracts");
    const organizationId = await requireOrganizationScope();
    const { id } = await context.params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("legal_contracts")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .select("*")
      .single();

  if (error || !data) {
    return jsonError("No se pudo archivar el contrato.", 500, error?.message);
  }

  await logActivity({
    action: "contract.archived",
    entityType: "legal_contract",
    entityId: id,
    entityLabel: data.file_name,
  });

  return NextResponse.json({ contract: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado.";
    const status = message.includes("permiso") ? 403 : 500;
    return jsonError(message, status);
  }
}
