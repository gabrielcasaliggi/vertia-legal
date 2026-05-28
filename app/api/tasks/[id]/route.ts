import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/contracts/activity-log";
import type { TaskPriority, TaskStatus } from "@/lib/contracts/tasks";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, Database } from "@/lib/supabase/types";

const STATUSES: TaskStatus[] = ["pending", "in_progress", "completed", "cancelled"];
const PRIORITIES: TaskPriority[] = ["low", "normal", "high", "urgent"];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ ok: true } | ApiErrorResponse>> {
  const { id } = await context.params;
  const body: unknown = await request.json();

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const payload = body as {
    title?: string;
    description?: string;
    assignee_name?: string;
    due_at?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    actor_name?: string;
  };

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
  if (payload.due_at !== undefined) {
    update.due_at = payload.due_at;
  }
  if (payload.status && STATUSES.includes(payload.status)) {
    update.status = payload.status;
  }
  if (payload.priority && PRIORITIES.includes(payload.priority)) {
    update.priority = payload.priority;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contract_tasks")
    .update(update)
    .eq("id", id)
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
}
