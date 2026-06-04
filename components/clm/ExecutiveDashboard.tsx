"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/clm/StatCard";
import {
  LIFECYCLE_LABELS,
  lifecycleBadgeClass,
  type LifecycleStatus,
} from "@/lib/contracts/lifecycle";
import type { ExecutiveDashboardStats } from "@/lib/contracts/executive-dashboard";

interface ExecutiveDashboardProps {
  searchExportParams: string | null;
  hasSearchResults: boolean;
}

function downloadBlob(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExecutiveDashboard({
  searchExportParams,
  hasSearchResults,
}: ExecutiveDashboardProps) {
  const [stats, setStats] = useState<ExecutiveDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const response = await fetch("/api/contracts/dashboard");
      const payload = await response.json();
      if (response.ok) {
        setStats(payload.stats ?? null);
      }
      setIsLoading(false);
    }

    void load();
  }, []);

  async function handleExportSearch() {
    if (!searchExportParams) {
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`/api/contracts/export/search?${searchExportParams}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Error al exportar.");
      }
      const blob = await response.blob();
      downloadBlob(blob, `vertia-busqueda-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (exportError) {
      const message =
        exportError instanceof Error ? exportError.message : "No se pudo exportar.";
      window.alert(message);
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="corp-panel ops-panel-accent p-6">
        <p className="corp-label text-cyan-700">Resumen del portfolio</p>
        <p className="mt-2 text-sm text-corp-muted">Cargando indicadores del portfolio...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <section className="corp-panel ops-panel-accent p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-corp-border pb-5">
        <div>
          <p className="corp-label text-cyan-700">Resumen del portfolio</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-corp-text">
            Mapa operativo del portfolio
          </h2>
          <p className="mt-1 text-sm text-corp-muted">
            Vista consolidada de documentos activos, vencimientos y riesgos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/contracts" className="corp-btn">
            Ver registro completo
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="corp-btn"
            aria-expanded={expanded}
          >
            {expanded ? "Ocultar detalle" : "Ver mapa completo"}
          </button>
          <button
            type="button"
            onClick={() => void handleExportSearch()}
            disabled={!hasSearchResults || !searchExportParams || isExporting}
            className="corp-btn"
          >
            {isExporting ? "Exportando..." : "Exportar búsqueda (CSV)"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Documentos activos"
          value={stats.totals.contracts}
          accent="bg-cyan-500"
        />
        <StatCard
          label="Auditados"
          value={stats.totals.analyzed}
          hint="Con informe IA"
          accent="bg-emerald-500"
        />
        <StatCard
          label="Indexados"
          value={stats.totals.indexed}
          hint="Pendientes de revisión IA"
          accent="bg-sky-500"
        />
        <StatCard
          label="Riesgo promedio"
          value={stats.risk.promedio_auditado ?? "—"}
          hint="Solo contratos auditados"
          accent="bg-amber-500"
        />
      </div>

      {expanded ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-corp border border-corp-border bg-white/70 p-5 shadow-corp">
          <p className="corp-label mb-4">Estado del portfolio</p>
          <div className="space-y-2">
            {(Object.keys(LIFECYCLE_LABELS) as LifecycleStatus[]).map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-corp border border-transparent bg-white/55 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded-corp border px-2 py-0.5 text-xs ${lifecycleBadgeClass(status)}`}
                  >
                    {LIFECYCLE_LABELS[status]}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-corp-text">
                  {stats.lifecycle[status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-corp border border-corp-border bg-white/70 p-5 shadow-corp">
          <p className="corp-label mb-4">Vencimientos</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between rounded-corp bg-cyan-50 px-3 py-2">
              <span className="text-corp-muted">Próximos 30 días</span>
              <span className="font-semibold text-corp-text">{stats.expiring.within_30}</span>
            </div>
            <div className="flex justify-between rounded-corp bg-sky-50 px-3 py-2">
              <span className="text-corp-muted">Próximos 60 días</span>
              <span className="font-semibold text-corp-text">{stats.expiring.within_60}</span>
            </div>
            <div className="flex justify-between rounded-corp bg-slate-50 px-3 py-2">
              <span className="text-corp-muted">Próximos 90 días</span>
              <span className="font-semibold text-corp-text">{stats.expiring.within_90}</span>
            </div>
            <div className="flex justify-between rounded-corp bg-red-50 px-3 py-2">
              <span className="text-corp-muted">Vencidos</span>
              <span className="font-semibold text-red-800">{stats.expiring.expired}</span>
            </div>
          </div>

          <p className="corp-label mb-3 mt-6">Exposición por riesgo (auditados)</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-corp-muted">Alto</span>
              <span className="font-semibold text-red-800">{stats.risk.alto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-corp-muted">Medio</span>
              <span className="font-semibold text-amber-900">{stats.risk.medio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-corp-muted">Bajo</span>
              <span className="font-semibold text-emerald-800">{stats.risk.bajo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-corp-muted">Sin auditar</span>
              <span className="font-semibold text-corp-text">{stats.risk.sin_auditar}</span>
            </div>
          </div>
        </div>

        <div className="rounded-corp border border-corp-border bg-white/70 p-5 shadow-corp">
          <p className="corp-label mb-4">Próximos vencimientos</p>
          <div className="space-y-3">
            {stats.upcoming_expirations.length === 0 ? (
              <p className="text-sm text-corp-muted">Sin vencimientos en 90 días.</p>
            ) : (
              stats.upcoming_expirations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-corp border border-corp-border bg-white/80 px-3 py-2.5 transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <Link
                    href={`/contracts/${item.id}`}
                    className="text-sm font-medium text-corp-text hover:underline"
                  >
                    {item.file_name}
                  </Link>
                  <p className="mt-1 text-xs text-corp-muted">{item.client_name}</p>
                  <p className="mt-1 text-xs font-medium text-corp-text">
                    {item.days_remaining <= 0
                      ? "Vencido"
                      : `Vence en ${item.days_remaining} día(s)`}
                  </p>
                </div>
              ))
            )}
          </div>

          {stats.top_clients.length > 0 && (
            <>
              <p className="corp-label mb-3 mt-6">Clientes con más expedientes</p>
              <div className="space-y-2">
                {stats.top_clients.map((client) => (
                  <div
                    key={client.client_name}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-corp-muted">{client.client_name}</span>
                    <span className="font-semibold text-corp-text">{client.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      ) : null}
    </section>
  );
}
