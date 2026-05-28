export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface ContractTask {
  id: string;
  contract_id: string | null;
  obligation_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  assignee_name: string | null;
  due_at: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export function taskStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "in_progress":
      return "border-cyan-200 bg-cyan-50 text-cyan-900";
    case "cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-amber-200 bg-amber-50 text-amber-900";
  }
}

export function taskPriorityBadgeClass(priority: TaskPriority): string {
  switch (priority) {
    case "urgent":
      return "border-red-200 bg-red-50 text-red-800";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "low":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-cyan-200 bg-cyan-50 text-cyan-900";
  }
}
