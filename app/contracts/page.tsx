"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { CorpSkeletonGrid } from "@/components/clm/CorpSkeleton";
import {
  ContractUploadForm,
  type ContractUploadMetadata,
} from "@/components/clm/ContractUploadForm";
import { PageHeader } from "@/components/clm/PageHeader";
import { StatCard } from "@/components/clm/StatCard";
import { useUserProfile } from "@/components/clm/UserProfileContext";
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
import { parseApiJsonResponse } from "@/lib/http/api-response";
import type { ContractIndexResponse, ContractListItem } from "@/lib/supabase/types";

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
  const router = useRouter();
  const { can } = useUserProfile();
  const canUpload = can("upload_contracts");
  const canCompare = can("run_audit");
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function loadContracts() {
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

  useEffect(() => {
    void loadContracts();
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

  async function handleUpload(file: File, metadata: ContractUploadMetadata) {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_name", metadata.client_name);
      formData.append("folder_name", metadata.folder_name);
      if (metadata.contract_type) {
        formData.append("contract_type", metadata.contract_type);
      }
      if (metadata.document_category) {
        formData.append("document_category", metadata.document_category);
      }

      const response = await fetch("/api/contracts/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await parseApiJsonResponse<ContractIndexResponse | { error: string; details?: string }>(
        response,
      );

      if (!response.ok) {
        throw new Error(
          (payload as { error: string; details?: string }).details ??
            (payload as { error: string }).error ??
            "Error al indexar.",
        );
      }

      setShowUpload(false);
      router.push(`/contracts/${(payload as ContractIndexResponse).id}`);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "No se pudo indexar el contrato.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AppPageLayout
      header={
        <PageHeader
          label="Registro documental"
          title="Documentos del estudio"
          subtitle="Todos los PDFs cargados. Abrí uno para ver el archivo, metadatos, tareas y revisión asistida."
          actions={
            <>
              {canCompare ? (
                <Link href="/contracts/comparar" className="corp-btn">
                  Comparar contratos
                </Link>
              ) : null}
              {canUpload ? (
                <button
                  type="button"
                  onClick={() => setShowUpload(true)}
                  className="corp-btn-primary"
                >
                  Cargar documento
                </button>
              ) : null}
            </>
          }
        />
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total monitoreado" value={stats.total} accent="bg-cyan-500" variant="panel" />
        <StatCard
          label="Con texto indexado"
          value={stats.indexed}
          hint="Disponibles para consulta asistida"
          accent="bg-emerald-500"
          variant="panel"
        />
        <StatCard
          label="Ventana crítica"
          value={stats.critical}
          hint="Vencidos o próximos a 30 días"
          accent="bg-amber-500"
          variant="panel"
        />
        <StatCard
          label="Clientes"
          value={stats.clients}
          hint="Carteras con documentos cargados"
          accent="bg-sky-500"
          variant="panel"
        />
      </section>

      <section className="corp-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="corp-label text-cyan-700">Explorador documental</p>
            <p className="mt-1 text-sm text-corp-muted">
              Filtrá por archivo, cliente, tipo contractual o partes.
            </p>
          </div>
          <Link href="/#buscar-documentos" className="corp-btn text-xs">
            Búsqueda avanzada
          </Link>
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
          <p className="corp-label">Listado de documentos</p>
          <p className="mt-1 text-sm text-corp-muted">
            Acceso rápido a visor PDF, metadatos, tareas, consulta asistida e integridad.
          </p>
        </div>

        {error ? <div className="m-5"><CorpAlert>{error}</CorpAlert></div> : null}

        {isLoading ? (
          <div className="p-5">
            <CorpSkeletonGrid count={4} />
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
                ? "Subí el primer PDF para habilitar búsqueda, visor, tareas y revisión asistida."
                : "Probá con el nombre del cliente, archivo, parte contractual o tipo de contrato."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {canUpload ? (
                <button type="button" onClick={() => setShowUpload(true)} className="corp-btn-primary">
                  Cargar documento
                </button>
              ) : null}
              {canCompare ? (
                <Link href="/contracts/comparar" className="corp-btn">
                  Comparar contratos
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 p-5 lg:grid-cols-2">
            {filtered.map((contract) => (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="group corp-inset p-4 transition hover:border-cyan-300 hover:bg-cyan-50/70 hover:shadow-corp"
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
                    <span className={`corp-badge ${lifecycleBadgeClass(contract.lifecycle_status)}`}>
                      {LIFECYCLE_LABELS[contract.lifecycle_status]}
                    </span>
                    <span className={`corp-badge ${processingBadgeClass(contract.status)}`}>
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

      {showUpload ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
        >
          <div className="corp-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="corp-label text-cyan-700">Registro documental</p>
                <h2 id="upload-modal-title" className="mt-1 text-xl font-semibold text-corp-text">
                  Cargar documento
                </h2>
              </div>
              <button type="button" onClick={() => setShowUpload(false)} className="corp-btn">
                Cerrar
              </button>
            </div>
            <ContractUploadForm disabled={isUploading} onUpload={(file, metadata) => void handleUpload(file, metadata)} />
          </div>
        </div>
      ) : null}
    </AppPageLayout>
  );
}
