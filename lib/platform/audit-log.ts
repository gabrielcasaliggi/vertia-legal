import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type PlatformAuditAction =
  | "organization.created"
  | "organization.updated"
  | "organization.owner_created"
  | "organization.suspended"
  | "organization.reactivated";

export async function logPlatformAction(input: {
  actorUserId: string;
  actorEmail: string;
  action: PlatformAuditAction;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: Json;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("platform_audit_log").insert({
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    entity_label: input.entityLabel ?? null,
    metadata: input.metadata ?? null,
  });

  if (error) {
    console.error("[platform_audit_log]", error.message);
  }
}
