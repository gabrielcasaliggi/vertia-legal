import { getActorDisplayName } from "@/lib/auth/actor";
import {
  activityActionLabel,
  type ActivityLogEntry,
  type LogActivityInput,
} from "@/lib/contracts/activity-log-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type { ActivityAction, ActivityLogEntry, LogActivityInput } from "@/lib/contracts/activity-log-types";
export { activityActionLabel };

export async function logActivity(input: LogActivityInput): Promise<void> {
  const supabase = createServerSupabaseClient();
  const actorName =
    input.actorName?.trim() || (await getActorDisplayName());

  const { error } = await supabase.from("activity_log").insert({
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    entity_label: input.entityLabel ?? null,
    actor_name: actorName,
    metadata: input.metadata ?? null,
  });

  if (error) {
    console.error("[activity_log] Failed to persist:", error.message);
  }
}

export async function fetchRecentActivity(limit = 30): Promise<ActivityLogEntry[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, entity_type, entity_id, entity_label, actor_name, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    entity_label: row.entity_label,
    actor_name: row.actor_name,
    metadata: row.metadata,
    created_at: row.created_at,
  }));
}
