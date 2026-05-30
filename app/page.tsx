"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityLogPanel } from "@/components/clm/ActivityLogPanel";
import { AlertsSidebar } from "@/components/clm/AlertsSidebar";
import { ContractHub } from "@/components/clm/ContractHub";
import { HomeQuickStart } from "@/components/clm/HomeQuickStart";
import {
  EMPTY_HYBRID_SEARCH,
  type HybridSearchFormState,
} from "@/components/clm/HybridSearchPanel";
import { ExecutiveDashboard } from "@/components/clm/ExecutiveDashboard";
import { ExplorerSidebar } from "@/components/clm/ExplorerSidebar";
import type { ContractIndexResponse, ContractListItem, ContractSearchMatch } from "@/lib/supabase/types";
import type { ContractUploadMetadata } from "@/components/clm/ContractUploadForm";
import type { ObligationListItem } from "@/lib/contracts/obligations";
import { parseApiJsonResponse } from "@/lib/http/api-response";

interface ApiErrorBody {
  error: string;
  details?: string;
}

interface SearchHeatmap {
  score: number;
  riesgo: "BAJO" | "MEDIO" | "ALTO";
  coincidencias: number;
}

interface ExpirationAlert {
  id: string;
  file_name: string;
  client_name: string;
  expires_at: string;
  days_remaining: number;
}

export default function ClmWorkspacePage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [obligations, setObligations] = useState<ObligationListItem[]>([]);
  const [hybridSearch, setHybridSearch] = useState<HybridSearchFormState>(EMPTY_HYBRID_SEARCH);
  const [filtersApplied, setFiltersApplied] = useState<string[]>([]);
  const [searchResultSummary, setSearchResultSummary] = useState<{
    contracts: number;
    matches: number;
  } | null>(null);
  const [searchMatches, setSearchMatches] = useState<ContractSearchMatch[]>([]);
  const [searchHeatmap, setSearchHeatmap] = useState<SearchHeatmap | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [activeChatContractId, setActiveChatContractId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingFileName, setIndexingFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedClient) {
      params.set("client_name", selectedClient);
    }
    if (selectedFolder) {
      params.set("folder_name", selectedFolder);
    }

    const response = await fetch(`/api/contracts?${params.toString()}`);
    const payload = await response.json();
    if (response.ok) {
      setContracts(payload.contracts ?? []);
    }
  }, [selectedClient, selectedFolder]);

  const loadAlerts = useCallback(async () => {
    const response = await fetch("/api/contracts/alerts");
    const payload = await response.json();
    if (response.ok) {
      setAlerts(payload.alerts ?? []);
    }
  }, []);

  const loadObligations = useCallback(async () => {
    const response = await fetch("/api/contracts/obligations?days=90");
    const payload = await response.json();
    if (response.ok) {
      setObligations(payload.obligations ?? []);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
    void loadAlerts();
    void loadObligations();
  }, [loadAlerts, loadContracts, loadObligations]);

  const visibleContracts = useMemo(() => contracts, [contracts]);

  function buildSearchParams(): URLSearchParams {
    const params = new URLSearchParams();
    const q = hybridSearch.query.trim();
    if (q.length >= 2) {
      params.set("q", q);
    }
    if (selectedClient) {
      params.set("client", selectedClient);
    }
    if (selectedFolder) {
      params.set("folder", selectedFolder);
    }
    if (hybridSearch.lifecycle) {
      params.set("lifecycle", hybridSearch.lifecycle);
    }
    if (hybridSearch.riesgo) {
      params.set("riesgo", hybridSearch.riesgo);
    }
    if (hybridSearch.contractType.trim()) {
      params.set("contract_type", hybridSearch.contractType.trim());
    }
    if (hybridSearch.documentCategory) {
      params.set("document_category", hybridSearch.documentCategory);
    }
    if (hybridSearch.party.trim()) {
      params.set("party", hybridSearch.party.trim());
    }
    if (hybridSearch.expiresBefore) {
      params.set("expires_before", hybridSearch.expiresBefore);
    }
    if (hybridSearch.expiresAfter) {
      params.set("expires_after", hybridSearch.expiresAfter);
    }
    if (hybridSearch.sort) {
      params.set("sort", hybridSearch.sort);
    }
    return params;
  }

  function hasSearchCriteria(): boolean {
    return (
      hybridSearch.query.trim().length >= 2 ||
      Boolean(selectedClient) ||
      Boolean(selectedFolder) ||
      Boolean(hybridSearch.lifecycle) ||
      Boolean(hybridSearch.riesgo) ||
      hybridSearch.contractType.trim().length > 0 ||
      Boolean(hybridSearch.documentCategory) ||
      hybridSearch.party.trim().length > 0 ||
      Boolean(hybridSearch.expiresBefore) ||
      Boolean(hybridSearch.expiresAfter)
    );
  }

  async function handleSearch() {
    if (!hasSearchCriteria()) {
      setSearchMatches([]);
      setSearchHeatmap(null);
      setSelectedMatchId(null);
      setActiveChatContractId(null);
      setFiltersApplied([]);
      setSearchResultSummary(null);
      await loadContracts();
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/search?${buildSearchParams().toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.details ?? payload.error);
      }

      setContracts(payload.contracts ?? []);
      setSearchMatches(payload.matches ?? []);
      setSearchHeatmap(payload.heatmap ?? null);
      setFiltersApplied(payload.summary?.filters_applied ?? []);
      setSearchResultSummary(
        payload.summary
          ? {
              contracts: payload.summary.total_contracts,
              matches: payload.summary.total_matches,
            }
          : null,
      );
      const firstMatch = payload.matches?.[0] ?? null;
      setSelectedMatchId(firstMatch?.id ?? null);
      setActiveChatContractId(firstMatch?.contract_id ?? null);
    } catch (searchError) {
      const message =
        searchError instanceof Error
          ? searchError.message
          : "Error en la búsqueda.";
      setError(message);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchClear() {
    setHybridSearch(EMPTY_HYBRID_SEARCH);
    setSearchMatches([]);
    setSearchHeatmap(null);
    setSelectedMatchId(null);
    setActiveChatContractId(null);
    setFiltersApplied([]);
    setSearchResultSummary(null);
    void loadContracts();
  }

  async function handleUpload(file: File, metadata: ContractUploadMetadata) {
    setError(null);
    setIndexingFileName(file.name);
    setIsIndexing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_name", metadata.client_name);
      formData.append("folder_name", metadata.folder_name);
      if (metadata.contract_type) {
        formData.append("contract_type", metadata.contract_type);
      }
      if (metadata.document_category) {
        formData.append("document_category", metadata.document_category);
      }

      const response = await fetch("/api/contracts/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload: ContractIndexResponse | ApiErrorBody =
        await parseApiJsonResponse<ContractIndexResponse | ApiErrorBody>(response);

      if (!response.ok) {
        throw new Error(
          (payload as ApiErrorBody).details ??
            (payload as ApiErrorBody).error ??
            "Error al indexar.",
        );
      }

      await loadContracts();
      await loadAlerts();
      await loadObligations();
      router.push(`/contracts/${(payload as ContractIndexResponse).id}`);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo indexar el contrato.";
      setError(message);
      setIsIndexing(false);
      setIndexingFileName(null);
    }
  }

  const selectedMatch = useMemo(
    () =>
      searchMatches.find((match) => match.id === selectedMatchId) ??
      searchMatches[0] ??
      null,
    [searchMatches, selectedMatchId],
  );

  function handleSelectMatch(match: ContractSearchMatch) {
    setSelectedMatchId(match.id);
    setActiveChatContractId(match.contract_id);
  }

  const searchExportParams = useMemo(() => {
    if (!hasSearchCriteria() || searchMatches.length === 0) {
      return null;
    }
    return buildSearchParams().toString();
  }, [hybridSearch, searchMatches.length, selectedClient, selectedFolder]);

  function scrollToElement(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="min-h-screen bg-corp-bg">
      <main className="mx-auto max-w-[1600px] space-y-5 p-5">
        <section className="corp-panel ops-panel-accent px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="corp-label text-cyan-700">Panel operativo</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-corp-text">
                Inicio operativo
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-corp-muted">
                Punto de partida para cargar documentos, buscar información,
                revisar vencimientos y preparar informes.
              </p>
            </div>
            <div className="rounded-corp border border-corp-border bg-white/70 px-4 py-3 text-right">
              <p className="corp-label text-cyan-700">Estado operativo</p>
              <p className="mt-1 text-sm font-medium text-corp-text">
                {contracts.length} expediente(s) en monitoreo
              </p>
            </div>
          </div>
        </section>

        <HomeQuickStart
          onScrollToSearch={() => scrollToElement("buscar-documentos")}
          onScrollToUpload={() => scrollToElement("carga-documentos")}
        />

        <ExecutiveDashboard
          searchExportParams={searchExportParams}
          hasSearchResults={searchMatches.length > 0}
        />

        <div className="grid items-start gap-5 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
          <ExplorerSidebar
            contracts={contracts}
            selectedClient={selectedClient}
            selectedFolder={selectedFolder}
            onSelectClient={setSelectedClient}
            onSelectFolder={setSelectedFolder}
          />
          <ContractHub
            contracts={visibleContracts}
            searchMatches={searchMatches}
            searchHeatmap={searchHeatmap}
            selectedMatchId={selectedMatchId}
            activeChatContractId={activeChatContractId}
            onSelectMatch={handleSelectMatch}
            hybridSearch={hybridSearch}
            onHybridSearchChange={setHybridSearch}
            onSearchSubmit={() => void handleSearch()}
            onSearchClear={handleSearchClear}
            filtersApplied={filtersApplied}
            searchResultSummary={searchResultSummary}
            isSearching={isSearching}
            isIndexing={isIndexing}
            indexingFileName={indexingFileName}
            error={error}
            defaultClient={selectedClient}
            defaultFolder={selectedFolder}
            onUpload={(file, metadata) => void handleUpload(file, metadata)}
          />
          <div className="space-y-5 xl:sticky xl:top-20">
            <AlertsSidebar
              alerts={alerts}
              obligations={obligations}
              searchMatches={searchMatches}
              selectedMatch={selectedMatch}
              selectedContractId={activeChatContractId}
            />
            <ActivityLogPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
