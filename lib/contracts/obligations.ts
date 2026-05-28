export type ObligationType = "general" | "payment" | "renewal" | "notice" | "compliance";
export type ObligationStatus = "pending" | "completed" | "overdue";
export type ObligationSource = "extracted" | "manual" | "ai";

export interface ContractObligation {
  id: string;
  contract_id: string;
  title: string;
  due_at: string | null;
  obligation_type: ObligationType;
  status: ObligationStatus;
  source: ObligationSource;
  created_at: string;
  updated_at: string;
}

export interface ObligationListItem extends ContractObligation {
  file_name: string;
  client_name: string;
  days_remaining: number | null;
}

export const OBLIGATION_TYPE_LABELS: Record<ObligationType, string> = {
  general: "General",
  payment: "Pago",
  renewal: "Renovación",
  notice: "Aviso / Rescisión",
  compliance: "Cumplimiento",
};

export const OBLIGATION_STATUS_LABELS: Record<ObligationStatus, string> = {
  pending: "Pendiente",
  completed: "Cumplida",
  overdue: "Vencida",
};

export function computeObligationStatus(
  status: ObligationStatus,
  dueAt: string | null,
  reference = new Date(),
): ObligationStatus {
  if (status === "completed") {
    return "completed";
  }

  if (!dueAt) {
    return status;
  }

  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return status;
  }

  const ref = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  );
  const target = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );

  if (target < ref) {
    return "overdue";
  }

  return "pending";
}

export function computeDaysUntilDue(
  dueAt: string | null,
  reference = new Date(),
): number | null {
  if (!dueAt) {
    return null;
  }

  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return null;
  }

  const ref = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  );
  const target = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );

  return Math.round((target - ref) / 86_400_000);
}

export function obligationStatusBadgeClass(status: ObligationStatus): string {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "overdue") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function formatObligationDueLabel(
  dueAt: string | null,
  reference = new Date(),
): string {
  const days = computeDaysUntilDue(dueAt, reference);

  if (days === null) {
    return "Sin fecha asignada";
  }
  if (days < 0) {
    return `Vencida hace ${Math.abs(days)} día(s)`;
  }
  if (days === 0) {
    return "Vence hoy";
  }
  return `Vence en ${days} día(s)`;
}
