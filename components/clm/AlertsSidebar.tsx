"use client";

import { formatExpiryLabel } from "@/lib/contracts/lifecycle";
import { ObligationsSidebarPanel } from "@/components/clm/ContractObligationsPanel";
import type { ObligationListItem } from "@/lib/contracts/obligations";
import {
  SemaphoreHeatmapCard,
  type SemaphoreLevel,
} from "@/components/hud/SemaphoreHeatmapCard";
import {
  diasToSemaphoreLevel,
  resolveVentanaSignal,
} from "@/lib/clm/search-signals";
import type { ContractSearchMatch } from "@/lib/supabase/types";

interface ExpirationAlert {
  id: string;
  file_name: string;
  client_name: string;
  expires_at: string;
  days_remaining: number;
}

interface AlertsSidebarProps {
  alerts: ExpirationAlert[];
  obligations?: ObligationListItem[];
  searchMatches?: ContractSearchMatch[];
  selectedMatch?: ContractSearchMatch | null;
  selectedContractId?: string | null;
}

function resolveAlertLevel(alerts: ExpirationAlert[]): SemaphoreLevel {
  if (alerts.length === 0) {
    return "idle";
  }

  const worstDays = Math.min(...alerts.map((alert) => alert.days_remaining));

  if (worstDays <= 0) {
    return "critical";
  }
  if (worstDays <= 7) {
    return "high";
  }
  if (worstDays <= 15) {
    return "moderate";
  }
  return "low";
}

function ventanaStatusDot(level: SemaphoreLevel): string {
  if (level === "critical" || level === "high") {
    return "status-dot-terracotta";
  }
  if (level === "moderate") {
    return "status-dot-amber";
  }
  if (level === "low") {
    return "status-dot-emerald";
  }
  return "status-dot-neutral";
}

export function AlertsSidebar({
  alerts,
  obligations = [],
  searchMatches = [],
  selectedMatch = null,
  selectedContractId = null,
}: AlertsSidebarProps) {
  const ventana = resolveVentanaSignal(selectedMatch, searchMatches);
  const searchActive = searchMatches.length > 0;
  const alertLevel = searchActive ? ventana.level : resolveAlertLevel(alerts);
  const ventanaLevel = selectedMatch
    ? diasToSemaphoreLevel(selectedMatch.dias_criticos)
    : "idle";

  return (
    <aside className="flex flex-col gap-5">
      {!searchActive ? (
        <SemaphoreHeatmapCard
          title="Alertas normativas"
          level={alertLevel}
          subtitle="Monitoreo de vencimientos contractuales"
          idleMessage="Esperando indexación de documento..."
        />
      ) : null}

      <div className="corp-panel flex min-h-0 flex-col p-6">
        <p className="corp-label">Ventana crítica</p>
        <p className="mt-2 text-sm text-corp-muted">
          {searchActive
            ? "Actualizada según el expediente seleccionado"
            : "Horizonte de seguimiento: 30 días"}
        </p>

        <div className="mt-5 max-h-[260px] space-y-4 overflow-y-auto pr-1">
          {searchActive && selectedMatch ? (
            <div className="rounded-corp border border-corp-border bg-corp-surface p-5">
              <div className="flex items-start gap-3">
                <span className={`${ventanaStatusDot(ventanaLevel)} mt-1.5`} aria-hidden />
                <div>
                  <p className="font-medium text-corp-text">{selectedMatch.archivo}</p>
                  <p className="mt-2 text-sm text-corp-muted">
                    Clasificación de riesgo: {selectedMatch.riesgo}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-corp-text">
                    {selectedMatch.expires_at
                      ? formatExpiryLabel(selectedMatch.expires_at)
                      : selectedMatch.dias_criticos === null
                        ? "Plazo no determinado"
                        : selectedMatch.dias_criticos <= 0
                          ? "Vencimiento inmediato"
                          : `${selectedMatch.dias_criticos} días restantes`}
                  </p>
                </div>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-corp-muted">
              Sin vencimientos registrados en los próximos 30 días.
            </p>
          ) : (
            alerts.map((alert) => {
              const level =
                alert.days_remaining <= 0
                  ? "critical"
                  : alert.days_remaining <= 7
                    ? "high"
                    : alert.days_remaining <= 15
                      ? "moderate"
                      : "low";

              return (
                <div
                  key={alert.id}
                  className="rounded-corp border border-corp-border bg-corp-surface p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className={`${ventanaStatusDot(level)} mt-1.5`} aria-hidden />
                    <div>
                      <p className="font-medium text-corp-text">{alert.file_name}</p>
                      <p className="mt-1 text-sm text-corp-muted">{alert.client_name}</p>
                      <p className="mt-2 text-sm font-medium text-corp-text">
                        {alert.days_remaining <= 0
                          ? "Vencido"
                          : `Vence en ${alert.days_remaining} día(s)`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ObligationsSidebarPanel
        obligations={obligations}
        selectedContractId={selectedContractId ?? selectedMatch?.contract_id ?? null}
      />
    </aside>
  );
}
