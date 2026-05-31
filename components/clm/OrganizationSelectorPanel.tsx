"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/clm/PageHeader";

interface OrganizationOption {
  id: string;
  name: string;
  slug: string;
  org_status: string;
  member_role: string;
}

export function OrganizationSelectorPanel() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/active-organization");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al cargar organizaciones.");
      }
      setOrganizations(payload.organizations ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSelect(organizationId: string) {
    setIsSelecting(organizationId);
    setError(null);
    try {
      const response = await fetch("/api/auth/active-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: organizationId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "No se pudo seleccionar.");
      }
      router.push("/");
      router.refresh();
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "Error al seleccionar.");
    } finally {
      setIsSelecting(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[720px] flex-col justify-center px-5 py-10">
      <PageHeader
        title="Seleccionar organización"
        subtitle="Tu usuario pertenece a más de un estudio. Elegí con cuál querés operar."
      />

      {error ? (
        <div className="mb-4 rounded-corp border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-400">Cargando organizaciones…</p>
      ) : organizations.length === 0 ? (
        <p className="text-sm text-slate-400">No tenés organizaciones activas asignadas.</p>
      ) : (
        <div className="grid gap-3">
          {organizations.map((organization) => (
            <button
              key={organization.id}
              type="button"
              disabled={Boolean(isSelecting)}
              onClick={() => void handleSelect(organization.id)}
              className="rounded-corp border border-slate-800 bg-slate-950/70 px-5 py-4 text-left transition hover:border-cyan-400/40 hover:bg-cyan-500/5 disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{organization.name}</p>
                  <p className="text-xs text-slate-500">{organization.slug}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {isSelecting === organization.id ? "Entrando…" : organization.org_status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
