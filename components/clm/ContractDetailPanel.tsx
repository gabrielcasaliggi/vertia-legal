"use client";

import { useCallback, useEffect, useState } from "react";
import { AssistedQueryHistoryPanel } from "@/components/clm/AssistedQueryHistoryPanel";
import { ContractChatPanel } from "@/components/clm/ContractChatPanel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContractMetadataEditor } from "@/components/clm/ContractMetadataEditor";
import { ContractObligationsPanel } from "@/components/clm/ContractObligationsPanel";
import { ContractRenewalPanel } from "@/components/clm/ContractRenewalPanel";
import { ContractTasksPanel } from "@/components/clm/ContractTasksPanel";
import { ContractSummaryCard } from "@/components/clm/ContractSummaryCard";
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

export function ContractDetailPanel({ contractId }: ContractDetailPanelProps) {
  const router = useRouter();
  const [contract, setContract] = useState<LegalContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryHistoryKey, setQueryHistoryKey] = useState(0);

  const applyContract = useCallback((row: LegalContract) => {
    setContract(row);
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function load() {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("legal_contracts")
        .select("*")
        .eq("id", contractId)
        .single();

      if (fetchError || !data) {
        setError("No se pudo cargar el contrato.");
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

      router.push("/");
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
    contract?.status === "indexed" || contract?.status === "pending_analysis";
  const canAssistedQuery = Boolean(
    contract?.extracted_text && contract.extracted_text.trim().length >= 30,
  );

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageHeader
        label="Expediente"
        title={contract?.file_name ?? "Detalle de contrato"}
        subtitle={
          contract
            ? `${contract.client_name} · ${contract.folder_name}`
            : undefined
        }
        actions={
          contract ? (
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-corp border px-2.5 py-1 text-xs font-medium ${lifecycleBadgeClass(contract.lifecycle_status)}`}
              >
                {LIFECYCLE_LABELS[contract.lifecycle_status]}
              </span>
              <span
                className={`rounded-corp border px-2.5 py-1 text-xs font-medium ${processingBadgeClass(contract.status)}`}
              >
                {PROCESSING_STATUS_LABELS[contract.status]}
              </span>
            </div>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-[1600px] px-6">
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-corp-border pb-4">
            {canAssistedQuery && (
              <a href="#consulta-asistida" className="corp-btn text-xs">
                Consulta asistida
              </a>
            )}
            {analysis && (
              <>
                <button
                  type="button"
                  onClick={() => void handleExportAudit("md")}
                  disabled={isExporting}
                  className="corp-btn"
                >
                  Informe MD
                </button>
                <button
                  type="button"
                  onClick={() => void handleExportAudit("html")}
                  disabled={isExporting}
                  className="corp-btn-primary"
                >
                  Informe HTML
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => void handleArchive()}
              disabled={isArchiving || !contract}
              className="corp-btn"
            >
              {isArchiving ? "Archivando..." : "Archivar expediente"}
            </button>
          <span className="rounded-corp border border-corp-border bg-corp-surface px-3 py-2 text-xs text-corp-muted">
            Ref: {contractId.slice(0, 8)}
          </span>
        </div>
      </div>

      <main className="mx-auto grid max-w-[1600px] gap-5 p-5 xl:grid-cols-2">
        <section className="corp-panel min-h-[70vh] p-6">
          <p className="corp-label mb-3">Visor documental</p>
          {isLoading ? (
            <p className="p-6 text-sm text-corp-muted">Cargando expediente…</p>
          ) : (
            <ContractPdfViewer contractId={contractId} />
          )}
        </section>

        <section className="space-y-5">
          {contract && <ContractSummaryCard contract={contract} />}

          {contract && (
            <ContractMetadataEditor contract={contract} onUpdated={applyContract} />
          )}

          {contract && (
            <ContractRenewalPanel contract={contract} onUpdated={applyContract} />
          )}

          <ContractObligationsPanel contractId={contractId} />

          <ContractTasksPanel
            contractId={contractId}
            clientId={contract?.client_id ?? undefined}
          />

          <div className="corp-panel p-6">
            <p className="corp-label mb-3">Integridad documental</p>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-corp-muted">Hash SHA-256</dt>
                <dd className="break-all text-xs text-slate-600">{contract?.file_hash}</dd>
              </div>
            </dl>

            {canAudit && (
              <button
                type="button"
                onClick={() => void runCognitiveAudit()}
                disabled={isAnalyzing}
                className="corp-btn-primary mt-5 w-full"
              >
                Ejecutar auditoría cognitiva
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-corp border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div id="auditoria-cognitiva" className="scroll-mt-24">
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
        </section>
      </main>

      {contract && (
        <section
          id="consulta-asistida"
          className="mx-auto grid max-w-[1600px] scroll-mt-24 gap-5 p-5 pt-0 xl:grid-cols-2"
        >
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
        </section>
      )}
    </div>
  );
}
