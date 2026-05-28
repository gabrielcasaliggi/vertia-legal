"use client";

import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
} from "@/lib/contracts/document-categories";
import { LIFECYCLE_LABELS, type LifecycleStatus } from "@/lib/contracts/lifecycle";
import type { HybridSearchSort } from "@/lib/contracts/hybrid-search";
import type { RiesgoNivel } from "@/lib/contracts/search-intelligence";

export interface HybridSearchFormState {
  query: string;
  lifecycle: LifecycleStatus | "";
  riesgo: RiesgoNivel | "";
  contractType: string;
  documentCategory: DocumentCategory | "";
  party: string;
  expiresBefore: string;
  expiresAfter: string;
  sort: HybridSearchSort;
}

interface HybridSearchPanelProps {
  value: HybridSearchFormState;
  onChange: (value: HybridSearchFormState) => void;
  onSubmit: () => void;
  onClear: () => void;
  isSearching: boolean;
  filtersApplied?: string[];
  resultSummary?: { contracts: number; matches: number } | null;
  syncClient?: string | null;
  syncFolder?: string | null;
}

const SORT_LABELS: Record<HybridSearchSort, string> = {
  risk: "Mayor riesgo primero",
  expiry: "Vencimiento más próximo",
  recent: "Carga más reciente",
};

export function HybridSearchPanel({
  value,
  onChange,
  onSubmit,
  onClear,
  isSearching,
  filtersApplied = [],
  resultSummary = null,
  syncClient = null,
  syncFolder = null,
}: HybridSearchPanelProps) {
  const hasActiveFilters =
    value.query.trim().length >= 2 ||
    value.lifecycle !== "" ||
    value.riesgo !== "" ||
    value.contractType.trim() !== "" ||
    value.documentCategory !== "" ||
    value.party.trim() !== "" ||
    value.expiresBefore !== "" ||
    value.expiresAfter !== "" ||
    Boolean(syncClient) ||
    Boolean(syncFolder);

  function patch(partial: Partial<HybridSearchFormState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="corp-panel p-6">
      <p className="corp-label mb-1">Buscar documentos</p>
      <p className="mb-4 text-sm text-corp-muted">
        Combine texto libre con filtros por cliente, estado, vencimiento o riesgo.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={value.query}
          onChange={(event) => patch({ query: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
          placeholder="Buscar cláusula, parte, monto o vencimiento..."
          className="corp-input min-w-[280px] flex-1"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSearching || !hasActiveFilters}
          className="corp-btn-primary"
        >
          {isSearching ? "Buscando..." : "Buscar"}
        </button>
        <button type="button" onClick={onClear} className="corp-btn">
          Limpiar
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <select
          value={value.lifecycle}
          onChange={(event) =>
            patch({ lifecycle: event.target.value as LifecycleStatus | "" })
          }
          className="corp-input"
        >
          <option value="">Estado del documento</option>
          {(Object.keys(LIFECYCLE_LABELS) as LifecycleStatus[]).map((status) => (
            <option key={status} value={status}>
              {LIFECYCLE_LABELS[status]}
            </option>
          ))}
        </select>

        <select
          value={value.riesgo}
          onChange={(event) => patch({ riesgo: event.target.value as RiesgoNivel | "" })}
          className="corp-input"
        >
          <option value="">Nivel de riesgo</option>
          <option value="BAJO">Riesgo bajo</option>
          <option value="MEDIO">Riesgo medio</option>
          <option value="ALTO">Riesgo alto</option>
        </select>

        <input
          value={value.contractType}
          onChange={(event) => patch({ contractType: event.target.value })}
          placeholder="Tipo de contrato"
          className="corp-input"
        />

        <select
          value={value.documentCategory}
          onChange={(event) =>
            patch({ documentCategory: event.target.value as DocumentCategory | "" })
          }
          className="corp-input"
        >
          <option value="">Categoría documental</option>
          {DOCUMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {DOCUMENT_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>

        <input
          value={value.party}
          onChange={(event) => patch({ party: event.target.value })}
          placeholder="Parte (nombre)"
          className="corp-input"
        />

        <label className="block text-sm">
          <span className="mb-1 block text-corp-muted">Vence hasta</span>
          <input
            type="date"
            value={value.expiresBefore}
            onChange={(event) => patch({ expiresBefore: event.target.value })}
            className="corp-input w-full"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-corp-muted">Vence desde</span>
          <input
            type="date"
            value={value.expiresAfter}
            onChange={(event) => patch({ expiresAfter: event.target.value })}
            className="corp-input w-full"
          />
        </label>

        <select
          value={value.sort}
          onChange={(event) => patch({ sort: event.target.value as HybridSearchSort })}
          className="corp-input md:col-span-2"
        >
          {(Object.keys(SORT_LABELS) as HybridSearchSort[]).map((sort) => (
            <option key={sort} value={sort}>
              Orden: {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>

      {(syncClient || syncFolder) && (
        <p className="mt-3 text-xs text-corp-muted">
          Explorador activo:
          {syncClient ? ` Cliente «${syncClient}»` : ""}
          {syncFolder ? ` · Carpeta «${syncFolder}»` : ""}
        </p>
      )}

      {filtersApplied.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filtersApplied.map((label) => (
            <span
              key={label}
              className="rounded-corp border border-corp-border bg-corp-surface px-2.5 py-1 text-xs text-corp-text"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {resultSummary && (
        <p className="mt-3 text-sm text-corp-muted">
          {resultSummary.contracts} expediente(s) · {resultSummary.matches} coincidencia(s)
        </p>
      )}
    </div>
  );
}

export const EMPTY_HYBRID_SEARCH: HybridSearchFormState = {
  query: "",
  lifecycle: "",
  riesgo: "",
  contractType: "",
  documentCategory: "",
  party: "",
  expiresBefore: "",
  expiresAfter: "",
  sort: "risk",
};
