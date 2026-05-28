import type { ContractStatus } from "@/lib/supabase/types";

export const PROCESSING_STATUS_LABELS: Record<ContractStatus, string> = {
  indexed: "Indexado",
  analyzed: "Auditado",
  failed: "Error de procesamiento",
  pending_analysis: "Pendiente de auditoría",
};

export function processingBadgeClass(status: ContractStatus): string {
  if (status === "analyzed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (status === "pending_analysis") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-corp-border bg-corp-surface text-corp-muted";
}
