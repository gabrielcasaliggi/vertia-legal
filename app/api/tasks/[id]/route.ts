import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/contracts/activity-log";
import { requirePermission } from "@/lib/auth/require-permission";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  assertTaskInOrganization,
  requireOrganizationScope,
} from "@/lib/auth/tenant-scope";
import type { TaskPriority, TaskStatus } from "@/lib/contracts/tasks";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, Database } from "@/lib/supabase/types";

const STATUSES: TaskStatus[] = ["pending", "in_progress", "completed", "cancelled"];
const PRIORITIES: TaskPriority[] = ["low", "normal", "high", "urgent"];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ ok: true } | ApiErrorResponse>> {
  try {
    await requirePermission("manage_tasks");
    const organizationId = await requireOrganizationScope();
    const profile = await getCurrentProfile();
    const { id } = await context.params;
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const payload = body as {
      title?: string;
      description?: string;
      assignee_name?: string;
      assignee_user_id?: string | null;
      due_at?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      actor_name?: string;
      take?: boolean;
    };

    const supabase = createServerSupabaseClient();
    await assertTaskInOrganization(supabase, id, organizationId);

    const update: Database["public"]["Tables"]["contract_tasks"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (payload.title !== undefined) {
      update.title = payload.title.trim();
    }
    if (payload.description !== undefined) {
      update.description = payload.description?.trim() || null;
    }
    if (payload.assignee_name !== undefined) {
      update.assignee_name = payload.assignee_name?.trim() || null;
    }
    if (payload.assignee_user_id !== undefined) {
      update.assignee_user_id = payload.assignee_user_id;
    }
    if (payload.due_at !== undefined) {
      update.due_at = payload.due_at;
    }
    if (payload.status && STATUSES.includes(payload.status)) {
      update.status = payload.status;
    }
    if (payload.priority && PRIORITIES.includes(payload.priority)) {
      update.priority = payload.priority;
    }

    if (payload.take === true && profile) {
      update.status = "in_progress";
      update.assignee_user_id = profile.id;
      update.assignee_name = profile.full_name.trim() || profile.email;
    }

    const { data, error } = await supabase
      .from("contract_tasks")
      .update(update)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select("id, title, status")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "No se pudo actualizar la tarea.", details: error?.message },
        { status: 500 },
      );
    }

    await logActivity({
      action: data.status === "completed" ? "task.completed" : "task.updated",
      entityType: "contract_task",
      entityId: data.id,
      entityLabel: data.title,
      actorName: payload.actor_name,
      metadata: { status: data.status },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado.";
    const status = message.includes("permiso") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
