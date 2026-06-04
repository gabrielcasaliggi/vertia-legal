import type { Json } from "@/lib/supabase/types";

export type ActivityAction =
  | "contract.uploaded"
  | "contract.updated"
  | "contract.archived"
  | "contract.analyzed"
  | "contract.assisted_query"
  | "contract.compared"
  | "contract.exported"
  | "search.exported"
  | "client.created"
  | "client.updated"
  | "matter.created"
  | "task.created"
  | "task.updated"
  | "task.completed"
  | "notification.digest_sent";

export interface LogActivityInput {
  action: ActivityAction;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  actorName?: string;
  metadata?: Json;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  actor_name: string;
  metadata: Json | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  "contract.uploaded": "Documento indexado",
  "contract.updated": "Metadatos actualizados",
  "contract.archived": "Expediente archivado",
  "contract.analyzed": "Auditoría cognitiva ejecutada",
  "contract.assisted_query": "Consulta asistida (IA)",
  "contract.compared": "Comparación contractual ejecutada",
  "contract.exported": "Informe exportado",
  "search.exported": "Búsqueda exportada (CSV)",
  "client.created": "Cliente creado",
  "client.updated": "Cliente actualizado",
  "matter.created": "Expediente creado",
  "task.created": "Tarea creada",
  "task.updated": "Tarea actualizada",
  "task.completed": "Tarea completada",
  "notification.digest_sent": "Resumen por email enviado",
};

export function activityActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}
