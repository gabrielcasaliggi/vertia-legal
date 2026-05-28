import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/contracts/activity-log";
import { listStudioClients } from "@/lib/clients/client-360-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

function jsonError(error: string, status: number, details?: string) {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status },
  );
}

export async function GET(): Promise<
  NextResponse<{ clients: Awaited<ReturnType<typeof listStudioClients>> } | ApiErrorResponse>
> {
  try {
    const clients = await listStudioClients();
    return NextResponse.json({ clients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar clientes.";
    return jsonError("No se pudieron cargar los clientes.", 500, message);
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ client: { id: string } } | ApiErrorResponse>> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return jsonError("JSON inválido.", 400);
    }

    const name = typeof (body as { name?: unknown }).name === "string"
      ? (body as { name: string }).name.trim()
      : "";

    if (!name) {
      return jsonError("El nombre del cliente es obligatorio.", 400);
    }

    const supabase = createServerSupabaseClient();
    const payload = body as {
      cuit?: string;
      practice_area?: string;
      responsible_name?: string;
      contact_email?: string;
      notes?: string;
      actor_name?: string;
    };

    const { data, error } = await supabase
      .from("studio_clients")
      .insert({
        name,
        cuit: payload.cuit?.trim() || null,
        practice_area: payload.practice_area?.trim() || null,
        responsible_name: payload.responsible_name?.trim() || null,
        contact_email: payload.contact_email?.trim() || null,
        notes: payload.notes?.trim() || null,
      })
      .select("id, name")
      .single();

    if (error || !data) {
      return jsonError("No se pudo crear el cliente.", 500, error?.message);
    }

    await logActivity({
      action: "client.created",
      entityType: "studio_client",
      entityId: data.id,
      entityLabel: data.name,
      actorName: payload.actor_name,
    });

    return NextResponse.json({ client: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno.";
    return jsonError("Error interno.", 500, message);
  }
}
