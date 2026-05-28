"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssistedQueryMode } from "@/lib/contracts/assisted-query";
import type { AssistedQueryHistoryEntry } from "@/lib/contracts/assisted-query-history";

interface AssistedQueryHistoryPanelProps {
  contractId: string;
  refreshKey?: number;
}

const MODE_LABELS: Record<AssistedQueryMode, string> = {
  document_query: "Consulta",
  legal_doubt: "Validar duda",
  risk_review: "Riesgos",
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AssistedQueryHistoryPanel({
  contractId,
  refreshKey = 0,
}: AssistedQueryHistoryPanelProps) {
  const [entries, setEntries] = useState<AssistedQueryHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}/queries`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo cargar el historial.");
      }
      setEntries(payload.entries ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Error al cargar historial.",
      );
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div className="corp-panel flex min-h-[280px] flex-col">
      <div className="border-b border-corp-border px-6 py-5">
        <p className="corp-label">Historial de consultas</p>
        <p className="mt-2 text-sm text-corp-muted">
          Registro de consultas asistidas sobre este expediente (trazabilidad operativa).
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <p className="text-sm text-corp-muted">Cargando historial…</p>
        ) : error ? (
          <p className="rounded-corp border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-corp-muted">
            Aún no hay consultas registradas en este expediente.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-corp border border-corp-border bg-corp-surface/60 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-900">
                    {MODE_LABELS[entry.modo]}
                  </span>
                  {entry.contexto_insuficiente && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                      Sin evidencia suficiente
                    </span>
                  )}
                  <span className="text-xs text-corp-muted">{formatWhen(entry.created_at)}</span>
                </div>
                <p className="mt-2 font-medium text-corp-text">
                  {entry.pregunta || "Consulta sin texto registrado"}
                </p>
                {entry.respuesta_breve ? (
                  <p className="mt-1.5 text-corp-muted leading-relaxed">
                    {entry.respuesta_breve}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-corp-muted">Por {entry.actor_name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-corp-border px-6 py-3">
        <button type="button" onClick={() => void load()} className="corp-btn text-xs">
          Actualizar historial
        </button>
      </div>
    </div>
  );
}
