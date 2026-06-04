"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { NotificationDigestPanel } from "@/components/clm/NotificationDigestPanel";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { PageHeader } from "@/components/clm/PageHeader";
import type { UserRole } from "@/lib/auth/roles";
import { canManageUsers } from "@/lib/auth/roles";
import type { StudioClient } from "@/lib/clients/studio-clients";
import type { ContractListItem } from "@/lib/supabase/types";

interface ReportesContentProps {
  userRole: UserRole;
}

export function ReportesContent({ userRole }: ReportesContentProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [clients, setClients] = useState<StudioClient[]>([]);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const isAdmin = canManageUsers(userRole);

  useEffect(() => {
    async function loadCatalogs() {
      setIsLoadingCatalog(true);
      setCatalogError(null);
      const [clientsResponse, contractsResponse] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/contracts"),
      ]);
      const [clientsPayload, contractsPayload] = await Promise.all([
        clientsResponse.json(),
        contractsResponse.json(),
      ]);

      if (clientsResponse.ok) {
        const loadedClients = (clientsPayload.clients ?? []) as StudioClient[];
        setClients(loadedClients);
        setSelectedClientId((current) => current || loadedClients[0]?.id || "");
      } else {
        setCatalogError(
          clientsPayload.details ??
            clientsPayload.error ??
            "No se pudo cargar la cartera de clientes.",
        );
      }
      if (contractsResponse.ok) {
        const loadedContracts = (contractsPayload.contracts ?? []) as ContractListItem[];
        setContracts(loadedContracts);
        setSelectedContractId((current) => current || loadedContracts[0]?.id || "");
      } else {
        setCatalogError(
          (current) =>
            current ??
            contractsPayload.details ??
            contractsPayload.error ??
            "No se pudo cargar el registro documental.",
        );
      }
      setIsLoadingCatalog(false);
    }

    void loadCatalogs();
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === selectedContractId) ?? null,
    [contracts, selectedContractId],
  );

  async function download(url: string, filename: string) {
    setMessage(null);
    const response = await fetch(url);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.error ?? "No se pudo generar el reporte.");
      return;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    setMessage("Descarga iniciada.");
  }

  function portfolioFileName(format: "md" | "html") {
    const name = selectedClient?.name ?? "cliente";
    const safeName = name.toLowerCase().replace(/[^a-z0-9._-]+/gi, "_").slice(0, 40);
    return `portfolio-${safeName}.${format}`;
  }

  function auditFileName(format: "md" | "html") {
    const name = selectedContract?.file_name ?? "contrato";
    const safeName = name.toLowerCase().replace(/[^a-z0-9._-]+/gi, "_").slice(0, 50);
    return `auditoria-${safeName}.${format}`;
  }

  return (
    <AppPageLayout
      width="standard"
      header={
        <PageHeader
          label="Entregables"
          title="Informes y exportaciones"
          subtitle="Genera entregables para clientes y exportes internos del estudio."
        />
      }
    >
      {catalogError ? <CorpAlert>{catalogError}</CorpAlert> : null}
      {message ? (
        <CorpAlert variant="info">{message}</CorpAlert>
      ) : null}

      {!isLoadingCatalog && clients.length === 0 && contracts.length === 0 ? (
        <CorpAlert variant="warning" title="Sin datos para exportar">
          Creá clientes o cargá documentos antes de generar informes. Podés empezar desde{" "}
          <Link href="/clients" className="font-medium underline">
            Clientes
          </Link>{" "}
          o{" "}
          <Link href="/contracts" className="font-medium underline">
            Documentos
          </Link>
          .
        </CorpAlert>
      ) : null}

        <section className="corp-panel ops-panel-accent p-6">
          <p className="corp-label text-cyan-700">Informes para clientes</p>
          <p className="mt-1 text-sm text-corp-muted">
            Resumen de expedientes, vencimientos, obligaciones y tareas para entrega al cliente.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <select
              value={selectedClientId}
              onChange={(event) => setSelectedClientId(event.target.value)}
              disabled={isLoadingCatalog || clients.length === 0}
              className="corp-input"
            >
              {clients.length === 0 ? (
                <option value="">Sin clientes cargados</option>
              ) : (
                clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))
              )}
            </select>
            <Link href="/clients" className="corp-btn text-center">
              Ver clientes
            </Link>
          </div>
          {selectedClient ? (
            <p className="mt-3 text-xs text-corp-muted">
              Responsable: {selectedClient.responsible_name ?? "sin asignar"}
              {selectedClient.practice_area ? ` · Área: ${selectedClient.practice_area}` : ""}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="corp-btn"
              disabled={!selectedClientId}
              onClick={() =>
                void download(
                  `/api/clients/${selectedClientId}/export?format=md`,
                  portfolioFileName("md"),
                )
              }
            >
              Descargar portfolio MD
            </button>
            <button
              type="button"
              className="corp-btn-primary"
              disabled={!selectedClientId}
              onClick={() =>
                void download(
                  `/api/clients/${selectedClientId}/export?format=html`,
                  portfolioFileName("html"),
                )
              }
            >
              Portfolio HTML imprimible
            </button>
          </div>
        </section>

        <section className="corp-panel p-6">
          <p className="corp-label">Informe de auditoría</p>
          <p className="mt-1 text-sm text-corp-muted">
            Seleccioná un contrato con auditoría cognitiva ejecutada para generar el informe.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <select
              value={selectedContractId}
              onChange={(event) => setSelectedContractId(event.target.value)}
              disabled={isLoadingCatalog || contracts.length === 0}
              className="corp-input"
            >
              {contracts.length === 0 ? (
                <option value="">Sin documentos cargados</option>
              ) : (
                contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.file_name} — {contract.client_name}
                  </option>
                ))
              )}
            </select>
            {selectedContractId ? (
              <Link href={`/contracts/${selectedContractId}`} className="corp-btn text-center">
                Abrir contrato
              </Link>
            ) : null}
          </div>
          {selectedContract ? (
            <p className="mt-3 text-xs text-corp-muted">
              Cliente: {selectedContract.client_name}
              {selectedContract.expires_at
                ? ` · Vence: ${new Date(selectedContract.expires_at).toLocaleDateString("es-AR")}`
                : " · Sin vencimiento"}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="corp-btn"
              disabled={!selectedContractId}
              onClick={() =>
                void download(
                  `/api/contracts/${selectedContractId}/export?format=md`,
                  auditFileName("md"),
                )
              }
            >
              Descargar auditoría MD
            </button>
            <button
              type="button"
              className="corp-btn-primary"
              disabled={!selectedContractId}
              onClick={() =>
                void download(
                  `/api/contracts/${selectedContractId}/export?format=html`,
                  auditFileName("html"),
                )
              }
            >
              Auditoría HTML imprimible
            </button>
          </div>
        </section>

        <section className="corp-panel p-6">
          <p className="corp-label">Exportes operativos</p>
          <ul className="mt-3 space-y-2 text-sm text-corp-muted">
            <li>
              <strong className="text-corp-text">CSV de búsqueda:</strong> ejecutá una búsqueda en
              Inicio y usá el botón &quot;Exportar búsqueda&quot; del resumen del portfolio.
            </li>
            <li>
              <strong className="text-corp-text">Bitácora:</strong> disponible en el panel derecho
              de Inicio.
            </li>
          </ul>
          <Link href="/" className="corp-btn mt-4 inline-block">
            Ir a Inicio
          </Link>
        </section>

      {isAdmin ? <NotificationDigestPanel /> : null}
    </AppPageLayout>
  );
}
