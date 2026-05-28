"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ContractTasksPanel } from "@/components/clm/ContractTasksPanel";
import { LIFECYCLE_LABELS, lifecycleBadgeClass } from "@/lib/contracts/lifecycle";
import type { Client360Payload } from "@/lib/clients/client-360-service";

interface Client360PanelProps {
  clientId: string;
}

export function Client360Panel({ clientId }: Client360PanelProps) {
  const [payload, setPayload] = useState<Client360Payload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      const data = await response.json();
      if (response.ok) {
        setPayload(data);
      }
      setIsLoading(false);
    }

    void load();
  }, [clientId]);

  async function handleExport(format: "md" | "html") {
    setIsExporting(true);
    const response = await fetch(`/api/clients/${clientId}/export?format=${format}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `portfolio-cliente.${format === "html" ? "html" : "md"}`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  }

  if (isLoading) {
    return (
      <div className="corp-panel p-6">
        <p className="text-sm text-corp-muted">Cargando vista Cliente 360...</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="corp-panel p-6">
        <p className="text-sm text-red-800">No se pudo cargar el cliente.</p>
      </div>
    );
  }

  const { summary, contracts } = payload;
  const { client } = summary;

  return (
    <div className="space-y-5">
      <section className="corp-panel ops-panel-accent p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="corp-label text-cyan-700">Cliente 360</p>
            <h1 className="mt-1 text-2xl font-semibold text-corp-text">{client.name}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-corp-muted">
              {client.cuit && <span>CUIT: {client.cuit}</span>}
              {client.responsible_name && (
                <span>Responsable: {client.responsible_name}</span>
              )}
              {client.practice_area && <span>Rubro: {client.practice_area}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExport("md")}
              className="corp-btn"
            >
              Informe MD
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExport("html")}
              className="corp-btn-primary"
            >
              Informe HTML
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Expedientes" value={summary.contractCount} />
          <Metric label="Por vencer (90d)" value={summary.expiringCount} />
          <Metric label="Obligaciones" value={summary.pendingObligations} />
          <Metric label="Tareas abiertas" value={summary.openTasks} />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="corp-panel p-5">
          <p className="corp-label mb-4">Expedientes del cliente</p>
          <div className="space-y-2">
            {contracts.length === 0 ? (
              <p className="text-sm text-corp-muted">Sin expedientes vinculados.</p>
            ) : (
              contracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="block rounded-corp border border-corp-border bg-white/70 px-4 py-3 transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-corp-text">{contract.file_name}</p>
                      <p className="mt-1 text-xs text-corp-muted">{contract.folder_name}</p>
                    </div>
                    <span
                      className={`rounded-corp border px-2 py-0.5 text-[11px] font-medium ${lifecycleBadgeClass(contract.lifecycle_status)}`}
                    >
                      {LIFECYCLE_LABELS[contract.lifecycle_status]}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <ContractTasksPanel clientId={clientId} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <p className="corp-label">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-corp-text">{value}</p>
    </div>
  );
}
