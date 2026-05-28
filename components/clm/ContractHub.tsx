"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ContractChatPanel } from "@/components/clm/ContractChatPanel";
import {
  HybridSearchPanel,
  type HybridSearchFormState,
} from "@/components/clm/HybridSearchPanel";
import { ContractUploadForm, type ContractUploadMetadata } from "@/components/clm/ContractUploadForm";
import { SearchResultCard } from "@/components/clm/SearchResultCard";
import { HudScanLoader } from "@/components/hud/HudScanLoader";
import { SemaphoreHeatmapCard } from "@/components/hud/SemaphoreHeatmapCard";
import {
  resolveHeatmapSignal,
  resolveSelectedMatch,
  type SearchHeatmap,
} from "@/lib/clm/search-signals";
import type { ContractListItem, ContractSearchMatch, ContractStatus } from "@/lib/supabase/types";
import { LIFECYCLE_LABELS, lifecycleBadgeClass } from "@/lib/contracts/lifecycle";
import {
  PROCESSING_STATUS_LABELS,
  processingBadgeClass,
} from "@/lib/contracts/processing-status";

interface ContractHubProps {
  contracts: ContractListItem[];
  searchMatches: ContractSearchMatch[];
  searchHeatmap: SearchHeatmap | null;
  selectedMatchId: string | null;
  activeChatContractId: string | null;
  onSelectMatch: (match: ContractSearchMatch) => void;
  hybridSearch: HybridSearchFormState;
  onHybridSearchChange: (value: HybridSearchFormState) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  filtersApplied: string[];
  searchResultSummary: { contracts: number; matches: number } | null;
  isSearching: boolean;
  isIndexing: boolean;
  indexingFileName: string | null;
  error: string | null;
  defaultClient?: string | null;
  defaultFolder?: string | null;
  onUpload: (file: File, metadata: ContractUploadMetadata) => void;
}

function statusBadgeClass(status: ContractStatus): string {
  return processingBadgeClass(status);
}

function statusLabel(status: ContractStatus): string {
  return PROCESSING_STATUS_LABELS[status];
}

export function ContractHub({
  contracts,
  searchMatches,
  searchHeatmap,
  selectedMatchId,
  activeChatContractId,
  onSelectMatch,
  hybridSearch,
  onHybridSearchChange,
  onSearchSubmit,
  onSearchClear,
  filtersApplied,
  searchResultSummary,
  isSearching,
  isIndexing,
  indexingFileName,
  error,
  defaultClient,
  defaultFolder,
  onUpload,
}: ContractHubProps) {
  const selectedMatch = useMemo(
    () => resolveSelectedMatch(searchMatches, selectedMatchId),
    [searchMatches, selectedMatchId],
  );

  const heatmapSignal = resolveHeatmapSignal(searchHeatmap, selectedMatch);

  if (isIndexing) {
    return <HudScanLoader fileName={indexingFileName ?? undefined} />;
  }

  return (
    <section className="flex h-full flex-col gap-5">
      <div id="buscar-documentos" className="scroll-mt-24">
        <HybridSearchPanel
          value={hybridSearch}
          onChange={onHybridSearchChange}
          onSubmit={onSearchSubmit}
          onClear={onSearchClear}
          isSearching={isSearching}
          filtersApplied={filtersApplied}
          resultSummary={searchResultSummary}
          syncClient={defaultClient}
          syncFolder={defaultFolder}
        />
      </div>

      <SemaphoreHeatmapCard
        title="Indicador de riesgo contractual"
        level={heatmapSignal.level}
        score={heatmapSignal.score}
        subtitle={heatmapSignal.subtitle}
        idleMessage="Cargue o busque un documento para ver el indicador."
      />

      {searchMatches.length > 0 ? (
        <div className="space-y-5">
          <div className="px-1">
            <p className="corp-label">Resultados de la búsqueda</p>
              <p className="mt-1.5 text-sm text-corp-muted">
              {searchMatches.length} coincidencia(s). Seleccione un expediente para
              actualizar las métricas y habilitar la consulta asistida.
            </p>
          </div>

          <div className="grid gap-4">
            {searchMatches.map((match) => (
              <SearchResultCard
                key={match.id}
                match={match}
                selected={selectedMatch?.id === match.id}
                onSelect={() => onSelectMatch(match)}
              />
            ))}
          </div>

          {activeChatContractId && selectedMatch ? (
            <ContractChatPanel
              contractId={activeChatContractId}
              contractFileName={selectedMatch.archivo}
              matches={searchMatches}
              selectedMatch={selectedMatch}
              variant="hub"
            />
          ) : null}
        </div>
      ) : hybridSearch.query.trim().length >= 2 ||
        hybridSearch.documentCategory !== "" ||
        filtersApplied.length > 0 ? (
        <div className="corp-panel p-8 text-center">
          <p className="text-sm text-corp-muted">
            No se encontraron expedientes con los criterios aplicados.
          </p>
        </div>
      ) : null}

      <div id="carga-documentos" className="corp-panel ops-panel-accent scroll-mt-24 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="corp-label text-cyan-700">Cargar documento</p>
            <p className="mt-1 text-sm text-corp-muted">
              Suba un PDF y complete los datos básicos para dejarlo listo para búsqueda.
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Sistema listo
          </span>
        </div>
        <ContractUploadForm
          defaultClient={defaultClient}
          defaultFolder={defaultFolder}
          onUpload={onUpload}
          disabled={isIndexing}
        />
        {error && (
          <p className="mt-3 rounded-corp border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>

      <div className="corp-panel ops-panel-accent min-h-0 flex-1 overflow-hidden">
        <div className="border-b border-corp-border px-5 py-4">
          <h2 className="corp-label text-cyan-700">Documentos recientes</h2>
          <p className="mt-1 text-sm text-corp-muted">
            Archivos disponibles para consulta, tareas y revisión asistida.
          </p>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-3">
          {contracts.length === 0 ? (
            <p className="p-4 text-sm text-corp-muted">
              Todavía no hay documentos. Use Cargar documento para agregar el primero.
            </p>
          ) : (
            contracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="block rounded-corp border border-transparent bg-white/35 px-4 py-3 transition hover:border-cyan-300 hover:bg-cyan-50/80 hover:shadow-corp"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-corp-text">{contract.file_name}</p>
                    <p className="mt-1 text-sm text-corp-muted">
                      {contract.client_name} · {contract.folder_name}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-corp border px-2 py-0.5 text-[11px] font-medium ${lifecycleBadgeClass(contract.lifecycle_status)}`}
                    >
                      {LIFECYCLE_LABELS[contract.lifecycle_status]}
                    </span>
                    <span
                      className={`rounded-corp border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(contract.status)}`}
                    >
                      {statusLabel(contract.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
