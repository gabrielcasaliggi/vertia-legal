"use client";

import { useEffect, useState } from "react";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { CorpSkeleton } from "@/components/clm/CorpSkeleton";
import type { ContractComparisonListItem } from "@/lib/contracts/contract-comparisons";

interface ContractCompareHistoryPanelProps {
  refreshKey?: number;
  onReopen: (comparisonId: string) => void;
}

function formatCompareDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function riskSideLabel(side: string): string {
  if (side === "base") {
    return "Más riesgo: base";
  }
  if (side === "comparado") {
    return "Más riesgo: comparado";
  }
  if (side === "equilibrado") {
    return "Riesgo equilibrado";
  }
  return side;
}

export function ContractCompareHistoryPanel({
  refreshKey = 0,
  onReopen,
}: ContractCompareHistoryPanelProps) {
  const [comparisons, setComparisons] = useState<ContractComparisonListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/contracts/compare");
        const payload = (await response.json()) as {
          comparisons?: ContractComparisonListItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo cargar el historial.");
        }

        if (!cancelled) {
          setComparisons(payload.comparisons ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Error al cargar historial de comparaciones.";
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
  }, [refreshKey]);

  return (
    <details className="corp-panel p-5">
      <summary className="cursor-pointer text-sm font-semibold text-corp-text">
        Historial de comparaciones
        {!isLoading && comparisons.length > 0 ? (
          <span className="ml-2 text-xs font-normal text-corp-muted">
            ({comparisons.length})
          </span>
        ) : null}
      </summary>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <CorpSkeleton className="h-20" />
            <CorpSkeleton className="h-20" />
          </div>
        ) : error ? (
          <CorpAlert>{error}</CorpAlert>
        ) : comparisons.length === 0 ? (
          <p className="text-sm text-corp-muted">
            Aún no hay comparaciones registradas en esta organización.
          </p>
        ) : (
          <ul className="space-y-2">
            {comparisons.map((item) => (
              <li
                key={item.id}
                className="corp-inset flex flex-wrap items-start justify-between gap-3 px-3 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-corp-text">{item.base_file_name}</p>
                  <p className="truncate text-xs text-corp-muted">vs {item.compared_file_name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-corp-muted">{item.summary}</p>
                  <p className="mt-1 text-xs text-corp-muted">
                    {formatCompareDate(item.created_at)} · {item.actor_name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-wrap justify-end gap-1.5 text-xs">
                    <span className="corp-badge border-cyan-200 bg-cyan-50 text-cyan-900">
                      {riskSideLabel(item.risk_side)}
                    </span>
                    <span className="corp-badge border-amber-200 bg-amber-50 text-amber-900">
                      {item.critical_count} críticos
                    </span>
                    <span className="corp-badge border-corp-border bg-corp-surface text-corp-muted">
                      {item.base_score}/{item.compared_score}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReopen(item.id)}
                    className="corp-btn text-xs"
                  >
                    Reabrir informe
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
