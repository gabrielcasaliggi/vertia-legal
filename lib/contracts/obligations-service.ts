import type { ContractAnalysisResult, StructuredObligation } from "@/lib/contracts/analysis";
import {
  computeObligationStatus,
  type ObligationSource,
  type ObligationType,
} from "@/lib/contracts/obligations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface SyncContext {
  expiresAt: string | null;
  autoRenewal: boolean;
  renewalNoticeDays: number | null;
}

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

function buildRenewalNoticeObligation(
  context: SyncContext,
): { title: string; due_at: string; obligation_type: ObligationType; source: ObligationSource } | null {
  if (!context.autoRenewal || !context.expiresAt || !context.renewalNoticeDays) {
    return null;
  }

  const expires = new Date(context.expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return null;
  }

  const noticeDate = new Date(expires);
  noticeDate.setUTCDate(noticeDate.getUTCDate() - context.renewalNoticeDays);

  return {
    title: `Aviso de no renovación — plazo de ${context.renewalNoticeDays} días antes del vencimiento`,
    due_at: noticeDate.toISOString(),
    obligation_type: "notice",
    source: "ai",
  };
}

function mapStructuredObligation(item: StructuredObligation) {
  return {
    title: item.titulo.trim(),
    due_at: item.fecha,
    obligation_type: item.tipo,
    source: "ai" as const,
  };
}

export async function syncObligationsFromAnalysis(
  contractId: string,
  analysis: ContractAnalysisResult,
  context: SyncContext,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const meta = analysis.metadatos;

  await supabase
    .from("contract_obligations")
    .delete()
    .eq("contract_id", contractId)
    .eq("source", "ai");

  const rows: Array<{
    contract_id: string;
    title: string;
    due_at: string | null;
    obligation_type: ObligationType;
    source: ObligationSource;
    status: "pending";
  }> = [];

  const seenTitles = new Set<string>();

  for (const item of meta?.obligaciones_estructuradas ?? []) {
    const mapped = mapStructuredObligation(item);
    const key = normalizeTitle(mapped.title);
    if (!key || seenTitles.has(key)) {
      continue;
    }
    seenTitles.add(key);
    rows.push({
      contract_id: contractId,
      ...mapped,
      status: "pending",
    });
  }

  for (const title of meta?.obligaciones_clave ?? []) {
    const trimmed = title.trim();
    const key = normalizeTitle(trimmed);
    if (!trimmed || seenTitles.has(key)) {
      continue;
    }
    seenTitles.add(key);
    rows.push({
      contract_id: contractId,
      title: trimmed,
      due_at: null,
      obligation_type: "general",
      source: "ai",
      status: "pending",
    });
  }

  const renewalNotice = buildRenewalNoticeObligation(context);
  if (renewalNotice) {
    rows.push({
      contract_id: contractId,
      ...renewalNotice,
      status: "pending",
    });
  }

  if (context.autoRenewal && context.expiresAt) {
    rows.push({
      contract_id: contractId,
      title: "Renovación automática del contrato",
      due_at: context.expiresAt,
      obligation_type: "renewal",
      source: "ai",
      status: "pending",
    });
  }

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("contract_obligations").insert(rows);
  if (error) {
    throw new Error(`No se pudieron sincronizar obligaciones: ${error.message}`);
  }
}

export async function refreshOverdueObligationStatuses(contractId?: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("contract_obligations")
    .select("id, status, due_at")
    .eq("status", "pending")
    .not("due_at", "is", null);

  if (contractId) {
    query = query.eq("contract_id", contractId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return;
  }

  const overdueIds = data
    .filter((row) => computeObligationStatus(row.status, row.due_at) === "overdue")
    .map((row) => row.id);

  if (overdueIds.length === 0) {
    return;
  }

  await supabase
    .from("contract_obligations")
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .in("id", overdueIds);
}
