"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ContractTasksPanel } from "@/components/clm/ContractTasksPanel";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { PageBreadcrumb } from "@/components/clm/PageBreadcrumb";
import { PageHeader } from "@/components/clm/PageHeader";
import { StatCard } from "@/components/clm/StatCard";
import { LIFECYCLE_LABELS, lifecycleBadgeClass } from "@/lib/contracts/lifecycle";
import type { Client360Payload } from "@/lib/clients/client-360-service";

interface Client360PanelProps {
  clientId: string;
}

export function Client360Panel({ clientId }: Client360PanelProps) {
  const [payload, setPayload] = useState<Client360Payload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/clients/${clientId}`);
      const data = await response.json();
      if (response.ok) {
        setPayload(data);
      } else {
        setError(data.details ?? data.error ?? "No se pudo cargar el cliente.");
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
    } else {
      setError("No se pudo exportar el portfolio del cliente.");
    }
    setIsExporting(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-corp-bg">
        <PageHeader
          label="Cliente 360"
          title="Cargando cliente..."
          subtitle="Recuperando cartera, expedientes y tareas vinculadas."
        />
        <main className="mx-auto max-w-[1200px] p-5">
          <div className="corp-panel p-6">
            <p className="text-sm text-corp-muted" role="status">
              Cargando vista Cliente 360...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-corp-bg">
        <PageBreadcrumb
          items={[
            { label: "Clientes", href: "/clients" },
            { label: "Cliente no encontrado" },
          ]}
        />
        <PageHeader
          label="Cliente 360"
          title="Cliente no encontrado"
          subtitle="No se pudo recuperar la vista consolidada."
        />
        <main className="mx-auto max-w-[1200px] space-y-5 p-5">
          {error ? <CorpAlert>{error}</CorpAlert> : null}
          <Link href="/clients" className="corp-btn-primary inline-block">
            Volver a Clientes
          </Link>
        </main>
      </div>
    );
  }

  const { summary, contracts } = payload;
  const { client } = summary;

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageBreadcrumb
        items={[
          { label: "Clientes", href: "/clients" },
          { label: client.name },
        ]}
      />
      <PageHeader
        label="Cliente 360"
        title={client.name}
        subtitle={
          [
            client.cuit ? `CUIT: ${client.cuit}` : null,
            client.responsible_name ? `Responsable: ${client.responsible_name}` : null,
            client.practice_area ? `Rubro: ${client.practice_area}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Vista consolidada de expedientes y tareas."
        }
        actions={
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
        }
      />

      <main className="mx-auto max-w-[1200px] space-y-5 p-5">
        {error ? <CorpAlert>{error}</CorpAlert> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Expedientes" value={summary.contractCount} accent="bg-cyan-500" />
          <StatCard
            label="Por vencer (90d)"
            value={summary.expiringCount}
            accent="bg-amber-500"
          />
          <StatCard
            label="Obligaciones"
            value={summary.pendingObligations}
            accent="bg-emerald-500"
          />
          <StatCard label="Tareas abiertas" value={summary.openTasks} accent="bg-sky-500" />
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="corp-panel p-5">
            <p className="corp-label mb-4 text-cyan-700">Expedientes del cliente</p>
            <div className="space-y-2">
              {contracts.length === 0 ? (
                <div>
                  <p className="text-sm text-corp-muted">Sin expedientes vinculados.</p>
                  <Link href="/contracts" className="corp-btn-primary mt-4 inline-block">
                    Cargar documento
                  </Link>
                </div>
              ) : (
                contracts.map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="corp-inset block px-4 py-3 transition hover:border-cyan-300 hover:bg-cyan-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-corp-text">{contract.file_name}</p>
                        <p className="mt-1 text-xs text-corp-muted">{contract.folder_name}</p>
                      </div>
                      <span
                        className={`corp-badge ${lifecycleBadgeClass(contract.lifecycle_status)}`}
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
      </main>
    </div>
  );
}
