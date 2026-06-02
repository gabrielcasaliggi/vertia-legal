"use client";

import { useEffect, useState } from "react";
import type { ContractAuditRecord } from "@/lib/contracts/contract-audits";

interface ContractAuditHistoryPanelProps {
  contractId: string;
  refreshKey?: number;
}

function formatAuditDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ContractAuditHistoryPanel({
  contractId,
  refreshKey = 0,
}: ContractAuditHistoryPanelProps) {
  const [audits, setAudits] = useState<ContractAuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/contracts/${contractId}/audits`);
        const payload = (await response.json()) as {
          audits?: ContractAuditRecord[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo cargar el historial.");
        }

        if (!cancelled) {
          setAudits(payload.audits ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Error al cargar historial de auditorías.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [contractId, refreshKey]);

  if (isLoading) {
    return (
      <div className="corp-panel p-5">
        <p className="corp-label mb-2">Historial de auditorías</p>
        <p className="text-sm text-corp-muted">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="corp-panel p-5">
        <p className="corp-label mb-2">Historial de auditorías</p>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="corp-panel p-5">
        <p className="corp-label mb-2">Historial de auditorías</p>
        <p className="text-sm text-corp-muted">
          Aún no hay auditorías registradas para este contrato.
        </p>
      </div>
    );
  }

  return (
    <div className="corp-panel p-5">
      <p className="corp-label mb-3">Historial de auditorías</p>
      <ul className="space-y-2">
        {audits.map((audit) => {
          const knowledge = audit.analysis_result.conocimiento_vertia;
          return (
            <li
              key={audit.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-corp border border-slate-200 bg-white/60 px-3 py-2.5 text-sm"
            >
              <div>
                <p className="font-medium text-slate-800">
                  Score {audit.score_riesgo}/100
                </p>
                <p className="text-xs text-corp-muted">
                  {formatAuditDate(audit.created_at)} · {audit.actor_name} · {audit.model}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {knowledge ? (
                  <>
                    <span className="rounded-corp border border-teal-200 bg-teal-50 px-2 py-0.5 text-teal-900">
                      {knowledge.signal_count} señales Vertia
                    </span>
                    <span className="rounded-corp border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-cyan-950">
                      {knowledge.rule_count} reglas
                    </span>
                  </>
                ) : (
                  <span className="rounded-corp border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">
                    Sin snapshot Vertia
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
