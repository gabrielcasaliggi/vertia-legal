import type { DocumentCategory } from "@/lib/contracts/document-categories";
import { isDocumentCategory } from "@/lib/contracts/document-categories";
import type { LifecycleStatus } from "@/lib/contracts/lifecycle";
import { computeDaysUntilExpiry } from "@/lib/contracts/lifecycle";
import type { ContractStatus } from "@/lib/supabase/types";
import {
  buildSearchMatches,
  riesgoToScore,
  simulateRiesgo,
  type ContractSearchMatch,
  type RiesgoNivel,
} from "@/lib/contracts/search-intelligence";

export type HybridSearchSort = "risk" | "expiry" | "recent";

export interface HybridSearchFilters {
  q: string | null;
  client: string | null;
  folder: string | null;
  lifecycle: LifecycleStatus | null;
  riesgo: RiesgoNivel | null;
  contract_type: string | null;
  document_category: DocumentCategory | null;
  party: string | null;
  expires_before: string | null;
  expires_after: string | null;
  sort: HybridSearchSort;
}

export interface ContractRowForSearch {
  id: string;
  file_name: string;
  client_name: string;
  folder_name: string;
  status: ContractStatus;
  file_hash: string;
  created_at: string;
  starts_at: string | null;
  expires_at: string | null;
  contract_type: string | null;
  party_a: string | null;
  party_b: string | null;
  lifecycle_status: LifecycleStatus;
  extracted_text: string | null;
}

const LIFECYCLE_VALUES: LifecycleStatus[] = [
  "draft",
  "active",
  "expiring",
  "expired",
  "unknown",
];

const RIESGO_VALUES: RiesgoNivel[] = ["BAJO", "MEDIO", "ALTO"];

const SORT_VALUES: HybridSearchSort[] = ["risk", "expiry", "recent"];

export function parseHybridSearchParams(
  params: URLSearchParams,
): HybridSearchFilters {
  const q = params.get("q")?.trim() || null;
  const lifecycleRaw = params.get("lifecycle")?.trim() ?? null;
  const riesgoRaw = params.get("riesgo")?.trim()?.toUpperCase() ?? null;
  const sortRaw = params.get("sort")?.trim() ?? "risk";

  return {
    q: q && q.length > 0 ? q : null,
    client: params.get("client")?.trim() || null,
    folder: params.get("folder")?.trim() || null,
    lifecycle:
      lifecycleRaw && LIFECYCLE_VALUES.includes(lifecycleRaw as LifecycleStatus)
        ? (lifecycleRaw as LifecycleStatus)
        : null,
    riesgo:
      riesgoRaw && RIESGO_VALUES.includes(riesgoRaw as RiesgoNivel)
        ? (riesgoRaw as RiesgoNivel)
        : null,
    contract_type: params.get("contract_type")?.trim() || null,
    document_category: (() => {
      const raw = params.get("document_category")?.trim() ?? "";
      return isDocumentCategory(raw) ? raw : null;
    })(),
    party: params.get("party")?.trim() || null,
    expires_before: parseDateParam(params.get("expires_before")),
    expires_after: parseDateParam(params.get("expires_after")),
    sort: SORT_VALUES.includes(sortRaw as HybridSearchSort)
      ? (sortRaw as HybridSearchSort)
      : "risk",
  };
}

function parseDateParam(value: string | null): string | null {
  if (!value?.trim()) {
    return null;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T23:59:59.000Z`).toISOString();
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

export function hasTextQuery(filters: HybridSearchFilters): boolean {
  return Boolean(filters.q && filters.q.length >= 2);
}

export function hasStructuralFilters(filters: HybridSearchFilters): boolean {
  return Boolean(
    filters.client ||
      filters.folder ||
      filters.lifecycle ||
      filters.riesgo ||
      filters.contract_type ||
      filters.document_category ||
      filters.party ||
      filters.expires_before ||
      filters.expires_after,
  );
}

export function describeAppliedFilters(filters: HybridSearchFilters): string[] {
  const labels: string[] = [];

  if (filters.q) {
    labels.push(`Texto: "${filters.q}"`);
  }
  if (filters.client) {
    labels.push(`Cliente: ${filters.client}`);
  }
  if (filters.folder) {
    labels.push(`Carpeta: ${filters.folder}`);
  }
  if (filters.lifecycle) {
    labels.push(`Estado: ${filters.lifecycle}`);
  }
  if (filters.riesgo) {
    labels.push(`Riesgo: ${filters.riesgo}`);
  }
  if (filters.contract_type) {
    labels.push(`Tipo: ${filters.contract_type}`);
  }
  if (filters.document_category) {
    labels.push(`Categoría: ${filters.document_category}`);
  }
  if (filters.party) {
    labels.push(`Parte: ${filters.party}`);
  }
  if (filters.expires_before) {
    labels.push(`Vence antes de ${filters.expires_before.slice(0, 10)}`);
  }
  if (filters.expires_after) {
    labels.push(`Vence después de ${filters.expires_after.slice(0, 10)}`);
  }

  return labels;
}

function excerptPreview(text: string, maxLength = 280): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}…`;
}

export function buildBrowseMatches(contracts: ContractRowForSearch[]): ContractSearchMatch[] {
  const matches: ContractSearchMatch[] = [];

  for (const contract of contracts) {
    const preview = contract.extracted_text
      ? excerptPreview(contract.extracted_text)
      : `Expediente indexado — ${contract.contract_type ?? "tipo no clasificado"}.`;

    const riesgo = simulateRiesgo(preview, "");
    const realDays = computeDaysUntilExpiry(contract.expires_at);

    matches.push({
      id: `${contract.id}:browse`,
      contract_id: contract.id,
      archivo: contract.file_name,
      snippet: preview,
      riesgo,
      dias_criticos: realDays,
      client_name: contract.client_name,
      folder_name: contract.folder_name,
      contract_type: contract.contract_type,
      party_a: contract.party_a,
      party_b: contract.party_b,
      starts_at: contract.starts_at,
      expires_at: contract.expires_at,
      lifecycle_status: contract.lifecycle_status,
    });
  }

  return matches;
}

export function filterMatchesByRiesgo(
  matches: ContractSearchMatch[],
  riesgo: RiesgoNivel | null,
): ContractSearchMatch[] {
  if (!riesgo) {
    return matches;
  }
  return matches.filter((match) => match.riesgo === riesgo);
}

export function sortSearchMatches(
  matches: ContractSearchMatch[],
  sort: HybridSearchSort,
  contractCreatedAt: Map<string, string>,
): ContractSearchMatch[] {
  const sorted = [...matches];

  if (sort === "expiry") {
    return sorted.sort((a, b) => {
      const daysA = a.dias_criticos ?? Number.MAX_SAFE_INTEGER;
      const daysB = b.dias_criticos ?? Number.MAX_SAFE_INTEGER;
      return daysA - daysB;
    });
  }

  if (sort === "recent") {
    return sorted.sort((a, b) => {
      const createdA = contractCreatedAt.get(a.contract_id) ?? "";
      const createdB = contractCreatedAt.get(b.contract_id) ?? "";
      return createdB.localeCompare(createdA);
    });
  }

  return sorted.sort((a, b) => riesgoToScore(b.riesgo) - riesgoToScore(a.riesgo));
}

export function runHybridSearchPipeline(
  contracts: ContractRowForSearch[],
  filters: HybridSearchFilters,
): ContractSearchMatch[] {
  const keyword = filters.q ?? "";
  let matches = hasTextQuery(filters)
    ? buildSearchMatches(contracts, keyword)
    : buildBrowseMatches(contracts);

  matches = filterMatchesByRiesgo(matches, filters.riesgo);

  const createdAtMap = new Map(contracts.map((row) => [row.id, row.created_at]));
  return sortSearchMatches(matches, filters.sort, createdAtMap);
}

export function resolveSearchMode(
  filters: HybridSearchFilters,
): "text" | "filters" | "hybrid" {
  if (hasTextQuery(filters) && hasStructuralFilters(filters)) {
    return "hybrid";
  }
  if (hasTextQuery(filters)) {
    return "text";
  }
  return "filters";
}
