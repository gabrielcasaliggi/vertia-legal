import type { NotificationConfig } from "@/lib/notifications/config";
import type {
  ExpirationDigestItem,
  NotificationDigest,
  ObligationDigestItem,
  TaskDigestItem,
} from "@/lib/notifications/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export async function gatherNotificationDigest(
  config: NotificationConfig,
): Promise<NotificationDigest> {
  const supabase = createServerSupabaseClient();

  const expirationHorizon = new Date();
  expirationHorizon.setDate(
    expirationHorizon.getDate() + config.expirationHorizonDays,
  );

  const { data: contractRows, error: contractsError } = await supabase
    .from("legal_contracts")
    .select("id, file_name, client_name, expires_at")
    .is("archived_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", expirationHorizon.toISOString())
    .order("expires_at", { ascending: true })
    .limit(30);

  if (contractsError) {
    throw new Error(contractsError.message);
  }

  const expirations: ExpirationDigestItem[] = (contractRows ?? []).map((row) => ({
    id: row.id,
    file_name: row.file_name,
    client_name: row.client_name,
    expires_at: row.expires_at as string,
    days_remaining: daysUntil(row.expires_at as string),
  }));

  const taskHorizon = new Date();
  taskHorizon.setDate(taskHorizon.getDate() + config.taskHorizonDays);

  const { data: taskRows, error: tasksError } = await supabase
    .from("contract_tasks")
    .select("id, title, assignee_name, due_at, priority, status, contract_id")
    .in("status", ["pending", "in_progress"])
    .not("due_at", "is", null)
    .lte("due_at", taskHorizon.toISOString())
    .order("due_at", { ascending: true })
    .limit(40);

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const tasks: TaskDigestItem[] = (taskRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    assignee_name: row.assignee_name,
    due_at: row.due_at,
    days_until_due: row.due_at ? daysUntil(row.due_at) : null,
    priority: row.priority,
    status: row.status,
    contract_id: row.contract_id,
  }));

  const obligationHorizon = new Date();
  obligationHorizon.setDate(
    obligationHorizon.getDate() + config.obligationHorizonDays,
  );

  const { data: obligationRows, error: obligationsError } = await supabase
    .from("contract_obligations")
    .select("id, title, contract_id, due_at, status, obligation_type")
    .neq("status", "completed")
    .not("due_at", "is", null)
    .lte("due_at", obligationHorizon.toISOString())
    .order("due_at", { ascending: true })
    .limit(40);

  if (obligationsError) {
    throw new Error(obligationsError.message);
  }

  const contractIds = [
    ...new Set((obligationRows ?? []).map((row) => row.contract_id)),
  ];

  const contractMeta = new Map<string, { file_name: string; client_name: string }>();

  if (contractIds.length > 0) {
    const { data: metaRows } = await supabase
      .from("legal_contracts")
      .select("id, file_name, client_name")
      .in("id", contractIds);

    for (const row of metaRows ?? []) {
      contractMeta.set(row.id, {
        file_name: row.file_name,
        client_name: row.client_name,
      });
    }
  }

  const obligations: ObligationDigestItem[] = (obligationRows ?? []).map((row) => {
    const meta = contractMeta.get(row.contract_id);
    return {
      id: row.id,
      title: row.title,
      contract_id: row.contract_id,
      file_name: meta?.file_name ?? "Contrato",
      client_name: meta?.client_name ?? "—",
      due_at: row.due_at,
      days_until_due: row.due_at ? daysUntil(row.due_at) : null,
      status: row.status,
      obligation_type: row.obligation_type,
    };
  });

  return {
    generated_at: new Date().toISOString(),
    expiration_horizon_days: config.expirationHorizonDays,
    expirations,
    tasks,
    obligations,
  };
}

export function digestHasItems(digest: NotificationDigest): boolean {
  return (
    digest.expirations.length > 0 ||
    digest.tasks.length > 0 ||
    digest.obligations.length > 0
  );
}
