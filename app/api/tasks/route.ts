import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import { logActivity } from "@/lib/contracts/activity-log";
import type { ContractTask, TaskPriority, TaskStatus } from "@/lib/contracts/tasks";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

function jsonError(error: string, status: number, details?: string) {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status },
  );
}

const STATUSES: TaskStatus[] = ["pending", "in_progress", "completed", "cancelled"];
const PRIORITIES: TaskPriority[] = ["low", "normal", "high", "urgent"];

function cleanSearchTerm(value: string | null): string {
  return (value ?? "").trim().replace(/[,()]/g, " ");
}

export async function GET(request: NextRequest): Promise<
  NextResponse<{ tasks: ContractTask[] } | ApiErrorResponse>
> {
  try {
    const organizationId = await requireOrganizationScope();
    const supabase = createServerSupabaseClient();
  const clientId = request.nextUrl.searchParams.get("client_id");
  const contractId = request.nextUrl.searchParams.get("contract_id");
  const openOnly = request.nextUrl.searchParams.get("open") === "1";
  const mineOnly = request.nextUrl.searchParams.get("mine") === "1";
  const status = request.nextUrl.searchParams.get("status") as TaskStatus | null;
  const priority = request.nextUrl.searchParams.get("priority") as TaskPriority | null;
  const assignee = cleanSearchTerm(request.nextUrl.searchParams.get("assignee"));
  const search = cleanSearchTerm(request.nextUrl.searchParams.get("q"));
  const due = request.nextUrl.searchParams.get("due");

  let query = supabase
    .from("contract_tasks")
    .select("*")
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(200);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }
  if (contractId) {
    query = query.eq("contract_id", contractId);
  }
  if (openOnly) {
    query = query.in("status", ["pending", "in_progress"]);
  }
  if (status && STATUSES.includes(status)) {
    query = query.eq("status", status);
  }
  if (priority && PRIORITIES.includes(priority)) {
    query = query.eq("priority", priority);
  }
  if (assignee) {
    query = query.ilike("assignee_name", `%${assignee}%`);
  }
  if (mineOnly) {
    const profile = await getCurrentProfile();
    if (!profile) {
      return jsonError("No autorizado.", 401);
    }
    query = query.eq("assignee_user_id", profile.id);
  }
  if (search) {
    query = query.or(
      [
        `title.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `assignee_name.ilike.%${search}%`,
      ].join(","),
    );
  }
  if (due === "overdue") {
    query = query.not("due_at", "is", null).lt("due_at", new Date().toISOString());
  } else if (due === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query.gte("due_at", start.toISOString()).lt("due_at", end.toISOString());
  } else if (due === "week") {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 7);
    query = query.not("due_at", "is", null).lte("due_at", horizon.toISOString());
  } else if (due === "no_due") {
    query = query.is("due_at", null);
  }

  const { data, error } = await query;

  if (error) {
    return jsonError("No se pudieron cargar las tareas.", 500, error.message);
  }

  return NextResponse.json({ tasks: (data ?? []) as ContractTask[] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado.";
    return jsonError(message, 403);
  }
}

export async function POST(request: NextRequest): Promise<
  NextResponse<{ task: ContractTask } | ApiErrorResponse>
> {
  try {
    await requirePermission("manage_tasks");
    const organizationId = await requireOrganizationScope();
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return jsonError("JSON inválido.", 400);
    }

    const payload = body as {
      title?: string;
      description?: string;
      assignee_name?: string;
      assignee_user_id?: string;
      due_at?: string;
      contract_id?: string;
      obligation_id?: string;
      client_id?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      actor_name?: string;
    };

    const title = payload.title?.trim();
    if (!title) {
      return jsonError("El título de la tarea es obligatorio.", 400);
    }

    const status =
      payload.status && STATUSES.includes(payload.status) ? payload.status : "pending";
    const priority =
      payload.priority && PRIORITIES.includes(payload.priority)
        ? payload.priority
        : "normal";

    const supabase = createServerSupabaseClient();

    let assigneeUserId =
      typeof payload.assignee_user_id === "string" && payload.assignee_user_id.trim()
        ? payload.assignee_user_id.trim()
        : null;
    let assigneeName = payload.assignee_name?.trim() || null;

    if (assigneeUserId) {
      const { data: assigneeProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", assigneeUserId)
        .maybeSingle();
      assigneeName = assigneeProfile?.full_name ?? assigneeName;
    }

    const { data, error } = await supabase
      .from("contract_tasks")
      .insert({
        title,
        description: payload.description?.trim() || null,
        assignee_name: assigneeName,
        assignee_user_id: assigneeUserId,
        due_at: payload.due_at || null,
        contract_id: payload.contract_id || null,
        obligation_id: payload.obligation_id || null,
        client_id: payload.client_id || null,
        organization_id: organizationId,
        status,
        priority,
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError("No se pudo crear la tarea.", 500, error?.message);
    }

    await logActivity({
      action: "task.created",
      entityType: "contract_task",
      entityId: data.id,
      entityLabel: data.title,
      actorName: payload.actor_name,
      metadata: { assignee_name: data.assignee_name },
    });

    return NextResponse.json({ task: data as ContractTask }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno.";
    const status = message.includes("permiso") ? 403 : 500;
    return jsonError(message, status);
  }
}
