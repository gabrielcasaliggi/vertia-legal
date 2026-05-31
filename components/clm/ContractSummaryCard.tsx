import type { LifecycleStatus } from "@/lib/contracts/lifecycle";
import {
  formatExpiryLabel,
  LIFECYCLE_LABELS,
  lifecycleBadgeClass,
} from "@/lib/contracts/lifecycle";
import type { ContractListItem, ContractSearchMatch } from "@/lib/supabase/types";
import { indexQualityLabel } from "@/lib/pdf/index-quality";
import type { IndexQuality } from "@/lib/pdf/index-quality";

interface ContractSummarySource {
  file_name?: string;
  archivo?: string;
  client_name: string;
  folder_name: string;
  contract_type?: string | null;
  party_a?: string | null;
  party_b?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  lifecycle_status?: LifecycleStatus;
  index_quality?: IndexQuality;
  contract_metadata?: { monto?: number | null; moneda?: string | null } | null;
}

interface ContractSummaryCardProps {
  contract: ContractSummarySource | ContractListItem | ContractSearchMatch;
  compact?: boolean;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "No determinada";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No determinada";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function resolveMetadata(
  contract: ContractSummarySource | ContractListItem | ContractSearchMatch,
): { monto?: number | null; moneda?: string | null } | null {
  if ("contract_metadata" in contract) {
    return contract.contract_metadata ?? null;
  }
  return null;
}

function resolveDisplayName(contract: ContractSummarySource): string | undefined {
  if ("file_name" in contract && contract.file_name) {
    return contract.file_name;
  }
  if ("archivo" in contract && contract.archivo) {
    return contract.archivo;
  }
  return undefined;
}

export function ContractSummaryCard({
  contract,
  compact = false,
}: ContractSummaryCardProps) {
  const lifecycle = contract.lifecycle_status ?? "unknown";
  const displayName = resolveDisplayName(contract);
  const metadata = resolveMetadata(contract);
  const indexQuality =
    "index_quality" in contract ? contract.index_quality : undefined;

  return (
    <div
      className={`rounded-corp border border-corp-border bg-corp-surface ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="corp-label">Ficha del expediente</p>
          {!compact && displayName && (
            <p className="mt-1 text-sm font-medium text-corp-text">{displayName}</p>
          )}
        </div>
        <span
          className={`rounded-corp border px-2.5 py-1 text-xs font-medium ${lifecycleBadgeClass(lifecycle)}`}
        >
          {LIFECYCLE_LABELS[lifecycle]}
        </span>
      </div>

      {indexQuality === "insufficient_text" ? (
        <p className="mt-3 rounded-corp border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {indexQualityLabel(indexQuality)}
        </p>
      ) : null}

      <dl className={`mt-4 grid gap-3 text-sm ${compact ? "grid-cols-1" : "md:grid-cols-2"}`}>
        <div>
          <dt className="text-corp-muted">Tipo contractual</dt>
          <dd className="font-medium text-corp-text">
            {contract.contract_type ?? "Sin clasificar"}
          </dd>
        </div>
        <div>
          <dt className="text-corp-muted">Cliente / Carpeta</dt>
          <dd className="text-corp-text">
            {contract.client_name} · {contract.folder_name}
          </dd>
        </div>
        <div>
          <dt className="text-corp-muted">Parte A</dt>
          <dd className="text-corp-text">{contract.party_a ?? "No identificada"}</dd>
        </div>
        <div>
          <dt className="text-corp-muted">Parte B</dt>
          <dd className="text-corp-text">{contract.party_b ?? "No identificada"}</dd>
        </div>
        <div>
          <dt className="text-corp-muted">Inicio de vigencia</dt>
          <dd className="text-corp-text">{formatDate(contract.starts_at)}</dd>
        </div>
        <div>
          <dt className="text-corp-muted">Fin de vigencia</dt>
          <dd className="font-medium text-corp-text">
            {formatDate(contract.expires_at)}
            {contract.expires_at && (
              <span className="mt-1 block text-xs font-normal text-corp-muted">
                {formatExpiryLabel(contract.expires_at)}
              </span>
            )}
          </dd>
        </div>
        {metadata?.monto != null && (
          <div>
            <dt className="text-corp-muted">Monto contractual</dt>
            <dd className="text-corp-text">
              {metadata.monto.toLocaleString("es-AR")} {metadata.moneda ?? ""}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
