"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { CorpSkeletonGrid } from "@/components/clm/CorpSkeleton";
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
    <AppPageLayout
      width="standard"
      className="flex min-h-[70vh] max-w-[720px] flex-col justify-center"
      header={
        <PageHeader
          label="Acceso multi-estudio"
          title="Seleccionar organización"
          subtitle="Tu usuario pertenece a más de un estudio. Elegí con cuál querés operar."
        />
      }
    >
      {error ? <CorpAlert>{error}</CorpAlert> : null}

      {isLoading ? (
        <CorpSkeletonGrid count={2} itemClassName="h-20" />
      ) : organizations.length === 0 ? (
        <CorpAlert variant="warning">
          No tenés organizaciones activas asignadas. Contactá al administrador de tu estudio.
        </CorpAlert>
      ) : (
        <div className="grid gap-3">
          {organizations.map((organization) => (
            <button
              key={organization.id}
              type="button"
              disabled={Boolean(isSelecting)}
              onClick={() => void handleSelect(organization.id)}
              className="corp-inset px-5 py-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50/70 disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-corp-text">{organization.name}</p>
                  <p className="text-xs text-corp-muted">{organization.slug}</p>
                </div>
                <span className="corp-badge border-corp-border bg-corp-surface text-corp-muted">
                  {isSelecting === organization.id ? "Entrando…" : organization.org_status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppPageLayout>
  );
}
