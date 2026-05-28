"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/clm/PageHeader";
import {
  computeDaysUntilExpiry,
  formatExpiryLabel,
  LIFECYCLE_LABELS,
  lifecycleBadgeClass,
} from "@/lib/contracts/lifecycle";
import {
  PROCESSING_STATUS_LABELS,
  processingBadgeClass,
} from "@/lib/contracts/processing-status";
import type { ContractListItem } from "@/lib/supabase/types";

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Sin fecha";
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

function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

export default function ContractsRegistryPage() {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/contracts");
      const payload = await response.json();
      if (response.ok) {
        setContracts(payload.contracts ?? []);
      } else {
        setError(payload.details ?? payload.error ?? "No se pudo cargar documentos.");
      }
      setIsLoading(false);
    }
    void load();
  }, []);

  const filtered = contracts.filter((contract) => {
    if (!query.trim()) {
      return true;
    }
    const term = query.toLowerCase();
    return (
      contract.file_name.toLowerCase().includes(term) ||
      contract.client_name.toLowerCase().includes(term) ||
      (contract.contract_type?.toLowerCase().includes(term) ?? false)
    );
  });

  const stats = useMemo(() => {
    const active = contracts.filter((contract) => contract.lifecycle_status === "active").length;
    const critical = contracts.filter((contract) => {
      const days = computeDaysUntilExpiry(contract.expires_at);
      return days !== null && days <= 30;
    }).length;
    const indexed = contracts.filter(
      (contract) => contract.status === "indexed" || contract.status === "pending_analysis",
    ).length;
    const clients = new Set(contracts.map((contract) => contract.client_name)).size;

    return { total: contracts.length, active, critical, indexed, clients };
  }, [contracts]);

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageHeader
        label="Registro documental"
        title="Documentos del estudio"
        subtitle="Todos los PDFs cargados. Abrí uno para ver el archivo, metadatos, tareas y revisión asistida."
        actions={
          <Link href="/#carga-documentos" className="corp-btn-primary">
            Cargar documento
          </Link>
        }
      />

      <main className="mx-auto max-w-[1600px] space-y-5 p-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="corp-panel ops-panel-accent p-5">
            <p className="corp-label text-cyan-700">Total monitoreado</p>
            <p className="mt-2 text-3xl font-semibold text-corp-text">{stats.total}</p>
            <p className="mt-1 text-xs text-corp-muted">Expedientes activos en registro</p>
          </div>
          <div className="corp-panel p-5">
            <p className="corp-label">Con texto indexado</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{stats.indexed}</p>
            <p className="mt-1 text-xs text-corp-muted">Disponibles para consulta asistida</p>
          </div>
          <div className="corp-panel p-5">
            <p className="corp-label">Ventana crítica</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{stats.critical}</p>
            <p className="mt-1 text-xs text-corp-muted">Vencidos o próximos a 30 días</p>
          </div>
          <div className="corp-panel p-5">
            <p className="corp-label">Clientes</p>
            <p className="mt-2 text-3xl font-semibold text-corp-text">{stats.clients}</p>
            <p className="mt-1 text-xs text-corp-muted">Carteras con documentos cargados</p>
          </div>
        </section>

        <section className="corp-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="corp-label text-cyan-700">Explorador documental</p>
              <p className="mt-1 text-sm text-corp-muted">
                Filtrá por archivo, cliente, tipo contractual o partes.
              </p>
            </div>
            <span className="rounded-full border border-corp-border bg-corp-surface px-3 py-1 text-xs font-semibold text-corp-muted">
              {filtered.length} resultado(s)
            </span>
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar: cliente, archivo, tipo, parte A o parte B..."
            className="corp-input mt-4 w-full"
          />
        </section>

        <section className="corp-panel overflow-hidden">
          <div className="border-b border-corp-border px-5 py-4">
            <p className="corp-label">Matriz de documentos</p>
            <p className="mt-1 text-sm text-corp-muted">
              Acceso rápido a visor PDF, metadatos, tareas, consulta asistida e integridad.
            </p>
          </div>

          {error ? (
            <p className="m-5 rounded-corp border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-corp border border-corp-border bg-corp-surface"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-medium text-corp-text">
                {contracts.length === 0
                  ? "Todavía no hay documentos cargados."
                  : "No hay documentos para ese filtro."}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm text-corp-muted">
                {contracts.length === 0
                  ? "Subí el primer PDF desde Inicio para habilitar búsqueda, visor, tareas y revisión asistida."
                  : "Probá con el nombre del cliente, archivo, parte contractual o tipo de contrato."}
              </p>
              <Link href="/#carga-documentos" className="corp-btn-primary mt-5 inline-block">
                Cargar documento
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 p-5 lg:grid-cols-2">
              {filtered.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="group rounded-corp border border-corp-border bg-white/70 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/70 hover:shadow-corp"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-corp-text group-hover:text-cyan-900">
                        {contract.file_name}
                      </p>
                      <p className="mt-1 text-sm text-corp-muted">
                        {contract.client_name} · {contract.folder_name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-corp border px-2 py-0.5 text-[11px] font-medium ${lifecycleBadgeClass(contract.lifecycle_status)}`}
                      >
                        {LIFECYCLE_LABELS[contract.lifecycle_status]}
                      </span>
                      <span
                        className={`rounded-corp border px-2 py-0.5 text-[11px] font-medium ${processingBadgeClass(contract.status)}`}
                      >
                        {PROCESSING_STATUS_LABELS[contract.status]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-xs text-corp-muted sm:grid-cols-2">
                    <div>
                      <p className="corp-label mb-1">Tipo</p>
                      <p className="text-corp-text">{contract.contract_type ?? "Sin clasificar"}</p>
                    </div>
                    <div>
                      <p className="corp-label mb-1">Vigencia</p>
                      <p
                        className={
                          computeDaysUntilExpiry(contract.expires_at) !== null &&
                          (computeDaysUntilExpiry(contract.expires_at) ?? 31) <= 30
                            ? "font-medium text-amber-800"
                            : "text-corp-text"
                        }
                      >
                        {formatExpiryLabel(contract.expires_at)}
                      </p>
                    </div>
                    <div>
                      <p className="corp-label mb-1">Partes</p>
                      <p className="text-corp-text">
                        {[contract.party_a, contract.party_b].filter(Boolean).join(" / ") ||
                          "Sin partes extraídas"}
                      </p>
                    </div>
                    <div>
                      <p className="corp-label mb-1">Alta</p>
                      <p className="text-corp-text">{formatDate(contract.created_at)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-corp-border pt-3">
                    <span className="font-mono text-[11px] text-corp-muted">
                      SHA-256 {shortHash(contract.file_hash)}
                    </span>
                    <span className="text-xs font-semibold text-cyan-800 group-hover:underline">
                      Abrir expediente
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
