"use client";

import type { ContractKnowledgeSnapshot } from "@/lib/contracts/analysis";

interface VertiaKnowledgePanelProps {
  snapshot: ContractKnowledgeSnapshot;
}

const RISK_STYLES = {
  alto: "border-red-200 bg-red-50/80 text-red-900",
  medio: "border-amber-200 bg-amber-50/80 text-amber-950",
  bajo: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

const CONFIDENCE_LABELS = {
  verificado: "Verificado",
  interpretativo: "Interpretativo",
  requiere_verificacion: "Requiere verificación",
} as const;

const CONFIDENCE_STYLES = {
  verificado: "border-teal-200 bg-teal-50 text-teal-900",
  interpretativo: "border-cyan-200 bg-cyan-50 text-cyan-950",
  requiere_verificacion: "border-orange-200 bg-orange-50 text-orange-950",
} as const;

function formatScanDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function VertiaKnowledgePanel({ snapshot }: VertiaKnowledgePanelProps) {
  const hasContent = snapshot.signals.length > 0 || snapshot.rules.length > 0;

  return (
    <div className="corp-panel border border-teal-200/60 bg-gradient-to-br from-slate-900/[0.02] to-teal-950/[0.04] p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="corp-label text-teal-800">Inteligencia Vertia</p>
          <h3 className="text-base font-semibold text-slate-900">
            Señales detectadas antes de la IA
          </h3>
          <p className="mt-1 text-xs text-corp-muted">
            Motor propio · escaneado {formatScanDate(snapshot.scanned_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-corp border border-teal-200 bg-teal-50 px-2.5 py-1 font-medium text-teal-900">
            {snapshot.signal_count} señales
          </span>
          <span className="rounded-corp border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-medium text-cyan-950">
            {snapshot.rule_count} reglas
          </span>
        </div>
      </div>

      {!hasContent ? (
        <p className="text-sm text-corp-muted">
          El motor Vertia no detectó señales estructuradas en este contrato. La auditoría
          se basó en criterio general del LLM.
        </p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Señales automáticas
            </h4>
            <ul className="space-y-3">
              {snapshot.signals.map((signal) => (
                <li
                  key={signal.id}
                  className="rounded-corp border border-slate-200 bg-white/70 p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="status-dot-emerald" aria-hidden />
                    <span className="text-xs font-medium uppercase tracking-wide text-teal-800">
                      {signal.tag.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800">{signal.descripcion}</p>
                  {signal.evidencia && (
                    <blockquote className="mt-2 border-l-2 border-teal-300 pl-2 text-xs italic text-slate-600">
                      &ldquo;{signal.evidencia}&rdquo;
                    </blockquote>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Reglas internas aplicadas
            </h4>
            <ul className="space-y-3">
              {snapshot.rules.map((rule) => (
                <li
                  key={rule.id}
                  className="rounded-corp border border-slate-200 bg-white/70 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-corp border px-2 py-0.5 text-[10px] font-semibold uppercase ${RISK_STYLES[rule.riesgo]}`}
                    >
                      Riesgo {rule.riesgo}
                    </span>
                    <span
                      className={`rounded-corp border px-2 py-0.5 text-[10px] font-medium ${CONFIDENCE_STYLES[rule.confianza]}`}
                    >
                      {CONFIDENCE_LABELS[rule.confianza]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{rule.titulo}</p>
                  <p className="mt-1 text-xs text-corp-muted">
                    {rule.norma} · {rule.fuente}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{rule.regla}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-corp-muted">
        Capa de conocimiento propia de Vertia. No reemplaza revisión profesional ni
        verificación normativa en fuentes oficiales.
      </p>
    </div>
  );
}
