import { computeDaysUntilExpiry } from "@/lib/contracts/lifecycle";
import type { LifecycleStatus } from "@/lib/contracts/lifecycle";
import type { ContractAnalysisResult } from "@/lib/contracts/analysis";
import type { ContractStatus } from "@/lib/supabase/types";

export interface DashboardContractRow {
  id: string;
  file_name: string;
  client_name: string;
  folder_name: string;
  status: ContractStatus;
  lifecycle_status: LifecycleStatus;
  expires_at: string | null;
  analysis_result: ContractAnalysisResult | null;
  created_at: string;
}

export interface ExecutiveDashboardStats {
  totals: {
    contracts: number;
    analyzed: number;
    indexed: number;
    failed: number;
  };
  lifecycle: Record<LifecycleStatus, number>;
  expiring: {
    within_30: number;
    within_60: number;
    within_90: number;
    expired: number;
  };
  risk: {
    alto: number;
    medio: number;
    bajo: number;
    sin_auditar: number;
    promedio_auditado: number | null;
  };
  top_clients: Array<{ client_name: string; count: number }>;
  upcoming_expirations: Array<{
    id: string;
    file_name: string;
    client_name: string;
    expires_at: string;
    days_remaining: number;
  }>;
}

function riskBucketFromScore(score: number): "alto" | "medio" | "bajo" {
  if (score >= 50) {
    return "alto";
  }
  if (score >= 25) {
    return "medio";
  }
  return "bajo";
}

export function buildExecutiveDashboardStats(
  rows: DashboardContractRow[],
): ExecutiveDashboardStats {
  const lifecycle: Record<LifecycleStatus, number> = {
    draft: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    unknown: 0,
  };

  const risk = { alto: 0, medio: 0, bajo: 0, sin_auditar: 0 };
  const expiring = { within_30: 0, within_60: 0, within_90: 0, expired: 0 };
  const clientCounts = new Map<string, number>();
  const upcoming: ExecutiveDashboardStats["upcoming_expirations"] = [];

  let analyzed = 0;
  let indexed = 0;
  let failed = 0;
  let riskSum = 0;
  let riskCount = 0;

  for (const row of rows) {
    lifecycle[row.lifecycle_status] += 1;

    if (row.status === "analyzed") {
      analyzed += 1;
    } else if (row.status === "indexed" || row.status === "pending_analysis") {
      indexed += 1;
    } else if (row.status === "failed") {
      failed += 1;
    }

    clientCounts.set(row.client_name, (clientCounts.get(row.client_name) ?? 0) + 1);

    const days = computeDaysUntilExpiry(row.expires_at);
    if (days !== null) {
      if (days < 0) {
        expiring.expired += 1;
      } else {
        if (days <= 30) {
          expiring.within_30 += 1;
        }
        if (days <= 60) {
          expiring.within_60 += 1;
        }
        if (days <= 90) {
          expiring.within_90 += 1;
        }

        if (days >= 0 && days <= 90) {
          upcoming.push({
            id: row.id,
            file_name: row.file_name,
            client_name: row.client_name,
            expires_at: row.expires_at!,
            days_remaining: days,
          });
        }
      }
    }

    if (row.analysis_result?.score_riesgo !== undefined) {
      const bucket = riskBucketFromScore(row.analysis_result.score_riesgo);
      risk[bucket] += 1;
      riskSum += row.analysis_result.score_riesgo;
      riskCount += 1;
    } else {
      risk.sin_auditar += 1;
    }
  }

  upcoming.sort((a, b) => a.days_remaining - b.days_remaining);

  const top_clients = [...clientCounts.entries()]
    .map(([client_name, count]) => ({ client_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totals: {
      contracts: rows.length,
      analyzed,
      indexed,
      failed,
    },
    lifecycle,
    expiring,
    risk: {
      ...risk,
      promedio_auditado: riskCount > 0 ? Math.round(riskSum / riskCount) : null,
    },
    top_clients,
    upcoming_expirations: upcoming.slice(0, 8),
  };
}
