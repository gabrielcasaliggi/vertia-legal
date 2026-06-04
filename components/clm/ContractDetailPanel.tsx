"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContractAuditHistoryPanel } from "@/components/clm/ContractAuditHistoryPanel";
import { AssistedQueryHistoryPanel } from "@/components/clm/AssistedQueryHistoryPanel";
import { ContractChatPanel } from "@/components/clm/ContractChatPanel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContractDocumentOpsPanel } from "@/components/clm/ContractDocumentOpsPanel";
import { ContractMetadataEditor } from "@/components/clm/ContractMetadataEditor";
import { ContractObligationsPanel } from "@/components/clm/ContractObligationsPanel";
import { ContractRenewalPanel } from "@/components/clm/ContractRenewalPanel";
import { ContractTasksPanel } from "@/components/clm/ContractTasksPanel";
import { ContractSummaryCard } from "@/components/clm/ContractSummaryCard";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { PageBreadcrumb } from "@/components/clm/PageBreadcrumb";
import { useUserProfile } from "@/components/clm/UserProfileContext";
import { parseContractAnalysisResult } from "@/lib/contracts/analysis";
import {
  PROCESSING_STATUS_LABELS,
  processingBadgeClass,
} from "@/lib/contracts/processing-status";
import { PageHeader } from "@/components/clm/PageHeader";
import { LIFECYCLE_LABELS, lifecycleBadgeClass } from "@/lib/contracts/lifecycle";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { LegalContract } from "@/lib/supabase/types";
import { ContractPdfViewer } from "@/components/clm/ContractPdfViewer";
import { ContractAnalysisDashboard } from "@/components/hud/ContractAnalysisDashboard";
import { PipelineLoadingState } from "@/components/hud/PipelineLoadingState";
import {
  scoreToSemaphoreLevel,
  SemaphoreHeatmapCard,
} from "@/components/hud/SemaphoreHeatmapCard";

interface ContractDetailPanelProps {
  contractId: string;
}

type DetailTab = "documento" | "operacion" | "inteligencia" | "consulta";

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "documento", label: "Documento" },
  { id: "operacion", label: "Operación" },
  { id: "inteligencia", label: "Inteligencia" },
  { id: "consulta", label: "Consulta" },
];

export function ContractDetailPanel({ contractId }: ContractDetailPanelProps) {
  const router = useRouter();
  const { can } = useUserProfile();
  const [contract, setContract] = useState<LegalContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("documento");
  const [queryHistoryKey, setQueryHistoryKey] = useState(0);
  const [auditHistoryKey, setAuditHistoryKey] = useState(0);
  const inteligenciaRef = useRef<HTMLDivElement>(null);

  const canRunAudit = can("run_audit");
  const canExport = can("export_reports");
  const canArchive = can("archive_contracts");
  const canAssistedQueryPermission = can("run_assisted_query");

  const applyContract = useCallback((row: LegalContract) => {
    setContract(row);
  }, []);

  const reloadContract = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from("legal_contracts")
      .select("*")
      .eq("id", contractId)
      .single();
    if (data) {
      applyContract(data);
    }
  }, [applyContract, contractId]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function load() {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      const { data, error: fetchError } = await supabase
        .from("legal_contracts")
        .select("*")
        .eq("id", contractId)
        .single();

      if (fetchError || !data) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      applyContract(data);
      setIsLoading(false);
    }

    void load();

    const channel = supabase
      .channel(`contract-detail-${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "legal_contracts",
          filter: `id=eq.${contractId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            applyContract(payload.new as LegalContract);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [applyContract, contractId]);

  async function runCognitiveAudit() {
    setIsAnalyzing(true);
    setError(null);
    setActiveTab("inteligencia");

    try {
      const response = await fetch("/api/contracts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_id: contractId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error en auditoría.");
      }

      setAuditHistoryKey((value) => value + 1);
      await reloadContract();
      inteligenciaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (auditError) {
      const message =
        auditError instanceof Error
          ? auditError.message
          : "No se pudo ejecutar la auditoría cognitiva.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleExportAudit(format: "md" | "html") {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/contracts/${contractId}/export?format=${format}`,
      );
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "No se pudo exportar el informe.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `informe-auditoria-${contract?.file_name ?? contractId}.${format === "html" ? "html" : "md"}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "No se pudo exportar el informe.";
      setError(message);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleArchive() {
    if (!contract || !window.confirm("¿Archivar este expediente? Dejará de aparecer en Inicio.")) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al archivar.");
      }

      router.push("/contracts");
    } catch (archiveError) {
      const message =
        archiveError instanceof Error
          ? archiveError.message
          : "No se pudo archivar el contrato.";
      setError(message);
    } finally {
      setIsArchiving(false);
    }
  }

  const analysis = parseContractAnalysisResult(contract?.analysis_result ?? null);
  const canAudit =
    canRunAudit &&
    (contract?.status === "indexed" || contract?.status === "pending_analysis");
  const canAssistedQuery = Boolean(
    canAssistedQueryPermission &&
      contract?.extracted_text &&
      contract.extracted_text.trim().length >= 30,
  );

  if (notFound) {
    return (
      <div className="min-h-screen bg-corp-bg">
        <PageBreadcrumb
          items={[
            { label: "Documentos", href: "/contracts" },
            { label: "Expediente no encontrado" },
          ]}
        />
        <PageHeader
          label="Expediente"
          title="Expediente no encontrado"
          subtitle="El documento solicitado no existe o no tenés acceso."
        />
        <main className="mx-auto max-w-[1200px] space-y-5 p-5">
          <CorpAlert title="Sin resultados">
            Verificá el enlace o volvé al registro documental del estudio.
          </CorpAlert>
          <Link href="/contracts" className="corp-btn-primary inline-block">
            Volver a Documentos
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageBreadcrumb
        items={[
          { label: "Documentos", href: "/contracts" },
          { label: contract?.file_name ?? "Expediente" },
        ]}
      />

      <PageHeader
        label="Expediente"
        title={contract?.file_name ?? "Detalle de contrato"}
        subtitle={
          contract
            ? `${contract.client_name} · ${contract.folder_name}`
            : "Recuperando metadatos del documento..."
        }
        actions={
          contract ? (
            <div className="flex flex-wrap gap-2">
              <span
                className={`corp-badge ${lifecycleBadgeClass(contract.lifecycle_status)}`}
              >
                {LIFECYCLE_LABELS[contract.lifecycle_status]}
              </span>
              <span className={`corp-badge ${processingBadgeClass(contract.status)}`}>
                {PROCESSING_STATUS_LABELS[contract.status]}
              </span>
            </div>
          ) : undefined
        }
      />

      <div className="sticky top-[var(--app-nav-offset,4.5rem)] z-30 border-b border-corp-border bg-corp-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={`rounded-corp px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border border-cyan-300 bg-cyan-50 text-cyan-900"
                    : "border border-transparent text-corp-muted hover:border-corp-border hover:bg-white/70 hover:text-corp-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canAssistedQuery ? (
              <button
                type="button"
                onClick={() => setActiveTab("consulta")}
                className="corp-btn text-xs"
              >
                Consulta asistida
              </button>
            ) : null}
            {contract && canRunAudit && canAssistedQuery ? (
              <Link
                href={`/contracts/comparar?base=${contractId}`}
                className="corp-btn text-xs"
              >
                Comparar con otro
              </Link>
            ) : null}
            {analysis && canExport ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleExportAudit("md")}
                  disabled={isExporting}
                  className="corp-btn text-xs"
                >
                  Informe MD
                </button>
                <button
                  type="button"
                  onClick={() => void handleExportAudit("html")}
                  disabled={isExporting}
                  className="corp-btn-primary text-xs"
                >
                  Informe HTML
                </button>
              </>
            ) : null}
            {canArchive ? (
              <button
                type="button"
                onClick={() => void handleArchive()}
                disabled={isArchiving || !contract}
                className="corp-btn text-xs"
              >
                {isArchiving ? "Archivando..." : "Archivar"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-[1600px] gap-5 p-5 xl:grid-cols-2">
        <section className="corp-panel min-h-[50vh] p-6 md:min-h-[70vh]">
          <p className="corp-label mb-3 text-cyan-700">Visor documental</p>
          {isLoading ? (
            <p className="p-6 text-sm text-corp-muted" role="status">
              Cargando expediente…
            </p>
          ) : (
            <ContractPdfViewer contractId={contractId} />
          )}
        </section>

        <section className="space-y-5">
          {error ? <CorpAlert>{error}</CorpAlert> : null}

          {activeTab === "documento" ? (
            <>
              {contract ? <ContractSummaryCard contract={contract} /> : null}
              {contract ? (
                <ContractMetadataEditor contract={contract} onUpdated={applyContract} />
              ) : null}
              {contract ? (
                <ContractRenewalPanel contract={contract} onUpdated={applyContract} />
              ) : null}
            </>
          ) : null}

          {activeTab === "operacion" ? (
            <>
              {contract ? (
                <ContractDocumentOpsPanel
                  contractId={contractId}
                  onUpdated={() => void reloadContract()}
                />
              ) : null}
              <ContractObligationsPanel contractId={contractId} />
              <ContractTasksPanel
                contractId={contractId}
                clientId={contract?.client_id ?? undefined}
              />
              <div className="corp-panel p-6">
                <p className="corp-label mb-3 text-cyan-700">Integridad documental</p>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-corp-muted">Hash SHA-256</dt>
                    <dd className="break-all text-xs text-slate-600">{contract?.file_hash}</dd>
                  </div>
                </dl>
              </div>
            </>
          ) : null}

          {activeTab === "inteligencia" ? (
            <div ref={inteligenciaRef} className="scroll-mt-28 space-y-5">
              {canAudit ? (
                <button
                  type="button"
                  onClick={() => void runCognitiveAudit()}
                  disabled={isAnalyzing}
                  className="corp-btn-primary w-full"
                >
                  {isAnalyzing ? "Auditando..." : "Ejecutar auditoría cognitiva"}
                </button>
              ) : null}

              {isAnalyzing ? (
                <PipelineLoadingState mode="cognitive" />
              ) : analysis ? (
                <div className="space-y-5">
                  <SemaphoreHeatmapCard
                    title="Indicador de riesgo contractual"
                    level={scoreToSemaphoreLevel(analysis.score_riesgo)}
                    score={analysis.score_riesgo}
                    subtitle="Resultado de auditoría cognitiva"
                  />
                  <ContractAnalysisDashboard analysis={analysis} />
                  <ContractAuditHistoryPanel
                    contractId={contractId}
                    refreshKey={auditHistoryKey}
                  />
                </div>
              ) : (
                <SemaphoreHeatmapCard
                  title="Indicador de riesgo contractual"
                  level="idle"
                  subtitle="Auditoría cognitiva bajo demanda"
                  idleMessage={
                    contract?.status === "indexed"
                      ? "Documento indexado. Ejecute auditoría cognitiva para obtener el indicador."
                      : "Esperando indexación de documento..."
                  }
                />
              )}
            </div>
          ) : null}

          {activeTab === "consulta" && contract ? (
            <div className="space-y-5">
              <ContractChatPanel
                contractId={contractId}
                contractFileName={contract.file_name}
                canQuery={canAssistedQuery}
                variant="detail"
                onQueryComplete={() => setQueryHistoryKey((value) => value + 1)}
              />
              <AssistedQueryHistoryPanel
                contractId={contractId}
                refreshKey={queryHistoryKey}
              />
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
