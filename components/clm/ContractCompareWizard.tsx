"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildComparisonReportHtml,
  buildComparisonReportMarkdown,
  type ContractComparisonResponse,
} from "@/lib/contracts/compare";
import { ContractCompareHistoryPanel } from "@/components/clm/ContractCompareHistoryPanel";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { useUserProfile } from "@/components/clm/UserProfileContext";
import { comparisonRiskClass } from "@/lib/contracts/risk-badges";
import {
  PROCESSING_STATUS_LABELS,
  processingBadgeClass,
} from "@/lib/contracts/processing-status";
import type { ContractListItem } from "@/lib/supabase/types";

interface ApiErrorBody {
  error: string;
  details?: string;
}

function isComparable(contract: ContractListItem): boolean {
  return (
    contract.status === "indexed" ||
    contract.status === "pending_analysis" ||
    contract.status === "analyzed"
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "No determinada";
  }

  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function downloadText(filename: string, content: string, mime = "text/markdown;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ContractOption({
  contract,
  selected,
  disabled = false,
  onSelect,
}: {
  contract: ContractListItem;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const comparable = isComparable(contract) && !disabled;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!comparable}
      className={`w-full rounded-corp border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
        selected
          ? "border-cyan-500 bg-cyan-50"
          : "border-corp-border bg-white/70 hover:border-cyan-300 hover:bg-cyan-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-corp-text">
            {contract.file_name}
          </p>
          <p className="mt-1 text-xs text-corp-muted">
            {contract.client_name} · {contract.folder_name}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-corp border px-2 py-0.5 text-[11px] font-medium ${processingBadgeClass(contract.status)}`}
        >
          {PROCESSING_STATUS_LABELS[contract.status]}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-corp-muted sm:grid-cols-2">
        <span>Tipo: {contract.contract_type ?? "Sin clasificar"}</span>
        <span>Vence: {formatDate(contract.expires_at)}</span>
        <span className="sm:col-span-2">
          Partes: {[contract.party_a, contract.party_b].filter(Boolean).join(" / ") ||
            "Sin partes extraídas"}
        </span>
      </div>
      {disabled && (
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-corp-muted">
          Ya elegido en la otra columna
        </p>
      )}
    </button>
  );
}

function SelectedContractSummary({
  label,
  contract,
}: {
  label: string;
  contract?: ContractListItem;
}) {
  return (
    <div className="min-w-0 rounded-corp border border-corp-border bg-white/80 px-4 py-3">
      <p className="corp-label">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-corp-text">
        {contract?.file_name ?? "Sin seleccionar"}
      </p>
      <p className="mt-1 truncate text-xs text-corp-muted">
        {contract ? `${contract.client_name} · ${contract.folder_name}` : "Elegí un documento"}
      </p>
    </div>
  );
}

function ResultSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-corp border border-corp-border bg-white/70 p-4"
      open={defaultOpen}
    >
      <summary className="cursor-pointer text-sm font-semibold text-corp-text">
        {title}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function ContractCompareWizard() {
  const searchParams = useSearchParams();
  const { can } = useUserProfile();
  const canRunComparison = can("run_audit");
  const reportRef = useRef<HTMLDivElement>(null);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [query, setQuery] = useState("");
  const [baseId, setBaseId] = useState(searchParams.get("base") ?? "");
  const [comparedId, setComparedId] = useState("");
  const [comparison, setComparison] = useState<ContractComparisonResponse | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContracts() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/contracts");
        const payload = (await response.json()) as
          | { contracts?: ContractListItem[] }
          | ApiErrorBody;

        if (!response.ok) {
          throw new Error("error" in payload ? payload.details ?? payload.error : "Error.");
        }

        setContracts("contracts" in payload ? payload.contracts ?? [] : []);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los contratos.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadContracts();
  }, []);

  const comparableContracts = useMemo(
    () => contracts.filter(isComparable),
    [contracts],
  );

  const filteredContracts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return comparableContracts;
    }

    return comparableContracts.filter((contract) => {
      return (
        contract.file_name.toLowerCase().includes(term) ||
        contract.client_name.toLowerCase().includes(term) ||
        contract.folder_name.toLowerCase().includes(term) ||
        (contract.contract_type?.toLowerCase().includes(term) ?? false) ||
        (contract.party_a?.toLowerCase().includes(term) ?? false) ||
        (contract.party_b?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [comparableContracts, query]);

  const baseContract = contracts.find((contract) => contract.id === baseId);
  const comparedContract = contracts.find((contract) => contract.id === comparedId);
  const canCompare = Boolean(baseId && comparedId && baseId !== comparedId);

  async function runComparison() {
    if (!canCompare) {
      return;
    }

    setIsComparing(true);
    setError(null);
    setComparison(null);

    try {
      const response = await fetch("/api/contracts/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_contract_id: baseId,
          compared_contract_id: comparedId,
        }),
      });
      const payload = (await response.json()) as ContractComparisonResponse | ApiErrorBody;

      if (!response.ok) {
        throw new Error("error" in payload ? payload.details ?? payload.error : "Error.");
      }

      setComparison(payload as ContractComparisonResponse);
      setHistoryKey((value) => value + 1);
      requestAnimationFrame(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (compareError) {
      const message =
        compareError instanceof Error
          ? compareError.message
          : "No se pudo ejecutar la comparación.";
      setError(message);
    } finally {
      setIsComparing(false);
    }
  }

  async function reopenComparison(comparisonId: string) {
    setIsReopening(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/compare/${comparisonId}`);
      const payload = (await response.json()) as ContractComparisonResponse | ApiErrorBody;

      if (!response.ok) {
        throw new Error("error" in payload ? payload.details ?? payload.error : "Error.");
      }

      const reopened = payload as ContractComparisonResponse;
      setComparison(reopened);
      setBaseId(reopened.base.id);
      setComparedId(reopened.compared.id);
      requestAnimationFrame(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (reopenError) {
      const message =
        reopenError instanceof Error
          ? reopenError.message
          : "No se pudo reabrir la comparación.";
      setError(message);
    } finally {
      setIsReopening(false);
    }
  }

  function exportMarkdown() {
    if (!comparison) {
      return;
    }

    const safeName = `${comparison.base.file_name}-vs-${comparison.compared.file_name}`
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 80);
    downloadText(
      `informe-comparativo-${safeName}.md`,
      buildComparisonReportMarkdown(comparison),
    );
  }

  function exportHtml() {
    if (!comparison) {
      return;
    }

    const safeName = `${comparison.base.file_name}-vs-${comparison.compared.file_name}`
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 80);
    downloadText(
      `informe-comparativo-${safeName}.html`,
      buildComparisonReportHtml(comparison),
      "text/html;charset=utf-8",
    );
  }

  if (!canRunComparison) {
    return (
      <div className="space-y-5">
        <CorpAlert variant="warning" title="Permiso requerido">
          Tu rol no tiene acceso al comparador contractual. Contactá al administrador del
          estudio si necesitás ejecutar comparaciones.
        </CorpAlert>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="corp-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="corp-label text-cyan-700">Selección comparativa</p>
            <p className="mt-2 max-w-3xl text-sm text-corp-muted">
              Elegí un contrato base y una versión o propuesta para detectar diferencias
              con impacto legal, económico y operativo. Ambas listas quedan visibles
              para evitar confusión.
            </p>
          </div>
          <span className="rounded-full border border-corp-border bg-corp-surface px-3 py-1 text-xs font-semibold text-corp-muted">
            {filteredContracts.length} comparables
          </span>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrar por archivo, cliente, carpeta, tipo o parte..."
          className="corp-input mt-4 w-full"
        />

        <div className="mt-4 rounded-corp border border-corp-border bg-slate-950/95 p-4 text-white">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <SelectedContractSummary label="Base" contract={baseContract} />
            <SelectedContractSummary label="Comparado" contract={comparedContract} />
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => {
                  setBaseId(comparedId);
                  setComparedId(baseId);
                  setComparison(null);
                }}
                disabled={!baseId || !comparedId}
                className="rounded-corp border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Intercambiar
              </button>
              <button
                type="button"
                onClick={() => {
                  setBaseId("");
                  setComparedId("");
                  setComparison(null);
                }}
                disabled={!baseId && !comparedId}
                className="rounded-corp border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => void runComparison()}
                disabled={!canCompare || isComparing}
                className="rounded-corp border border-cyan-300 bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isComparing ? "Comparando..." : "Comparar"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-corp border border-corp-border bg-white/60 p-4">
            <p className="corp-label">1. Contrato base</p>
            <p className="mt-1 text-xs text-corp-muted">
              Referencia: contrato viejo, firmado o modelo estándar.
            </p>
            <div className="mt-4 max-h-[330px] space-y-3 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-sm text-corp-muted">Cargando contratos...</p>
              ) : filteredContracts.length === 0 ? (
                <p className="text-sm text-corp-muted">No hay contratos comparables.</p>
              ) : (
                filteredContracts.map((contract) => (
                  <ContractOption
                    key={`base-${contract.id}`}
                    contract={contract}
                    selected={contract.id === baseId}
                    disabled={contract.id === comparedId}
                    onSelect={() => {
                      setBaseId(contract.id);
                      setComparison(null);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-corp border border-corp-border bg-white/60 p-4">
            <p className="corp-label">2. Contrato a comparar</p>
            <p className="mt-1 text-xs text-corp-muted">
              Propuesta nueva, versión actual o contrato alternativo.
            </p>
            <div className="mt-4 max-h-[330px] space-y-3 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-sm text-corp-muted">Cargando contratos...</p>
              ) : filteredContracts.length === 0 ? (
                <p className="text-sm text-corp-muted">No hay contratos comparables.</p>
              ) : (
                filteredContracts.map((contract) => (
                  <ContractOption
                    key={`compared-${contract.id}`}
                    contract={contract}
                    selected={contract.id === comparedId}
                    disabled={contract.id === baseId}
                    onSelect={() => {
                      setComparedId(contract.id);
                      setComparison(null);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="corp-panel ops-panel-accent p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="corp-label text-cyan-700">Informe comparativo</p>
              <h2 className="mt-2 text-xl font-semibold text-corp-text">
                Análisis base vs propuesta
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-corp-muted">
                Resumen ejecutivo, cambios críticos, diferencias operativas y recomendaciones
                para la revisión legal.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {comparison && (
                <>
                  <button type="button" onClick={exportMarkdown} className="corp-btn">
                    Exportar MD
                  </button>
                  <button type="button" onClick={exportHtml} className="corp-btn-primary">
                    Exportar HTML
                  </button>
                </>
              )}
            </div>
          </div>

          {baseId && comparedId && baseId === comparedId && (
            <CorpAlert variant="warning" className="mt-4">
              Seleccioná dos contratos distintos.
            </CorpAlert>
          )}
        </div>

        {error ? <CorpAlert>{error}</CorpAlert> : null}

        {isComparing && (
          <div className="corp-panel p-6">
            <p className="corp-label text-cyan-700">Procesando comparación</p>
            <p className="mt-3 text-sm text-corp-muted">
              Vertia está contrastando metadatos, señales legales y extractos relevantes.
              Este paso puede demorar unos segundos.
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-700" />
            </div>
          </div>
        )}

        {isReopening && (
          <div className="corp-panel p-6">
            <p className="corp-label text-cyan-700">Reabriendo informe</p>
            <p className="mt-3 text-sm text-corp-muted">Cargando comparación guardada...</p>
          </div>
        )}

        {!comparison && !isComparing && !isReopening && (
          <div className="corp-panel p-8 text-center">
            <p className="text-base font-semibold text-corp-text">
              Seleccioná dos contratos para iniciar el análisis.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-corp-muted">
              Recomendado para comparar contrato viejo vs propuesta nueva,
              contrato firmado vs modelo estándar o condiciones entre proveedores.
            </p>
          </div>
        )}

        {comparison && (
          <div ref={reportRef} className="scroll-mt-28 space-y-5">
            <div className="corp-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="corp-label text-cyan-700">Resumen ejecutivo</p>
                  <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">
                    {comparison.result.resumen_ejecutivo}
                  </p>
                </div>
                <div className="rounded-corp border border-corp-border bg-white/80 p-4 text-sm">
                  <p className="corp-label">Riesgo comparativo</p>
                  <p className="mt-2 font-semibold text-corp-text">
                    {comparison.result.riesgo_comparativo.documento_mas_riesgoso}
                  </p>
                  <p className="mt-1 text-xs text-corp-muted">
                    Base {comparison.result.riesgo_comparativo.score_base}/100 ·
                    Comparado {comparison.result.riesgo_comparativo.score_comparado}/100
                  </p>
                </div>
              </div>
              <p className="mt-4 rounded-corp border border-corp-border bg-corp-surface px-4 py-3 text-sm text-corp-muted">
                {comparison.result.riesgo_comparativo.motivo}
              </p>
            </div>

            <ResultSection title="Cambios críticos" defaultOpen>
              <div className="grid gap-3">
                {comparison.result.cambios_criticos.length === 0 ? (
                  <p className="text-sm text-corp-muted">
                    Sin cambios críticos detectados.
                  </p>
                ) : (
                  comparison.result.cambios_criticos.map((change, index) => (
                    <article
                      key={`${change.titulo}-${index}`}
                      className={`rounded-corp border p-4 ${comparisonRiskClass(change.nivel)}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">{change.titulo}</h3>
                        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[11px] font-semibold uppercase">
                          {change.nivel}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-75">
                        {change.categoria}
                      </p>
                      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                        <p>
                          <strong>Base:</strong> {change.contrato_base}
                        </p>
                        <p>
                          <strong>Comparado:</strong> {change.contrato_comparado}
                        </p>
                      </div>
                      <p className="mt-3 text-sm">
                        <strong>Impacto:</strong> {change.impacto}
                      </p>
                      <p className="mt-2 text-sm">
                        <strong>Sugerencia:</strong> {change.sugerencia}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </ResultSection>

            <ResultSection title="Diferencias operativas">
              <div className="grid gap-3 md:grid-cols-2">
                {comparison.result.diferencias_operativas.map((difference, index) => (
                  <div
                    key={`${difference.campo}-${index}`}
                    className="rounded-corp border border-corp-border bg-corp-surface p-4 text-sm"
                  >
                    <p className="font-semibold text-corp-text">{difference.campo}</p>
                    <p className="mt-2 text-corp-muted">
                      Base: {difference.contrato_base}
                    </p>
                    <p className="text-corp-muted">
                      Comparado: {difference.contrato_comparado}
                    </p>
                    <p className="mt-2 text-slate-700">{difference.relevancia}</p>
                  </div>
                ))}
              </div>
            </ResultSection>

            <ResultSection title="Cláusulas y recomendaciones">
              <div className="grid gap-4 lg:grid-cols-2">
                <ListBlock title="Agregadas" items={comparison.result.clausulas_agregadas} />
                <ListBlock title="Eliminadas" items={comparison.result.clausulas_eliminadas} />
                <ListBlock title="Modificadas" items={comparison.result.clausulas_modificadas} />
                <ListBlock title="Recomendaciones" items={comparison.result.recomendaciones} />
              </div>
            </ResultSection>
          </div>
        )}
      </section>

      <ContractCompareHistoryPanel
        refreshKey={historyKey}
        onReopen={(comparisonId) => void reopenComparison(comparisonId)}
      />
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-corp border border-corp-border bg-corp-surface p-4">
      <p className="corp-label">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-corp-muted">Sin elementos destacados.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-corp bg-white/70 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
