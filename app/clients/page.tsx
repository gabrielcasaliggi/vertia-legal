"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { CorpSkeletonGrid } from "@/components/clm/CorpSkeleton";
import { PageHeader } from "@/components/clm/PageHeader";
import type { StudioClient } from "@/lib/clients/studio-clients";

export default function ClientsPage() {
  const [clients, setClients] = useState<StudioClient[]>([]);
  const [name, setName] = useState("");
  const [cuit, setCuit] = useState("");
  const [responsible, setResponsible] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients() {
    setIsLoading(true);
    setError(null);
    const response = await fetch("/api/clients");
    const payload = await response.json();
    if (response.ok) {
      setClients(payload.clients ?? []);
    } else {
      setError(payload.details ?? payload.error ?? "No se pudieron cargar los clientes.");
    }
    setIsLoading(false);
  }

  useEffect(() => {
    void loadClients();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        cuit: cuit.trim() || null,
        responsible_name: responsible.trim() || null,
      }),
    });

    const payload = await response.json();
    if (response.ok) {
      setName("");
      setCuit("");
      setResponsible("");
      await loadClients();
    } else {
      setError(payload.details ?? payload.error ?? "No se pudo crear el cliente.");
    }
    setIsSaving(false);
  }

  return (
    <AppPageLayout
      width="standard"
      header={
        <PageHeader
          label="Cartera"
          title="Clientes 360"
          subtitle="Organizá la cartera por cliente. Los documentos también pueden crear clientes automáticamente desde Inicio."
        />
      }
    >
      {error ? <CorpAlert>{error}</CorpAlert> : null}

      <section className="corp-panel p-6">
        <p className="corp-label text-cyan-700">Alta de cliente</p>
        <form onSubmit={(event) => void handleCreate(event)} className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre / Razón social"
            className="corp-input"
          />
          <input
            value={cuit}
            onChange={(event) => setCuit(event.target.value)}
            placeholder="CUIT (opcional)"
            className="corp-input"
          />
          <input
            value={responsible}
            onChange={(event) => setResponsible(event.target.value)}
            placeholder="Responsable interno"
            className="corp-input"
          />
          <button type="submit" disabled={isSaving} className="corp-btn-primary">
            {isSaving ? "Guardando..." : "Crear cliente"}
          </button>
        </form>
      </section>

      <section className="corp-panel p-6">
        <p className="corp-label mb-4 text-cyan-700">Clientes registrados</p>
        {isLoading ? (
          <CorpSkeletonGrid count={4} itemClassName="h-28" />
        ) : clients.length === 0 ? (
          <div>
            <p className="text-sm text-corp-muted">
              Sin clientes formales. Creá uno acá o subí un documento desde Inicio con
              nombre de cliente distinto de &quot;General&quot;.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/contracts" className="corp-btn-primary">
                Cargar documento
              </Link>
              <Link href="/" className="corp-btn">
                Ir a Inicio
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="corp-inset px-4 py-4 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                <p className="font-medium text-corp-text">{client.name}</p>
                {client.cuit && (
                  <p className="mt-1 text-xs text-corp-muted">CUIT: {client.cuit}</p>
                )}
                {client.responsible_name && (
                  <p className="mt-1 text-xs text-corp-muted">
                    Responsable: {client.responsible_name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppPageLayout>
  );
}
