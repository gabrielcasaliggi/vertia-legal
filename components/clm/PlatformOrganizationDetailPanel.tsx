"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { PageBreadcrumb } from "@/components/clm/PageBreadcrumb";
import { PageHeader } from "@/components/clm/PageHeader";
import { StatCard } from "@/components/clm/StatCard";

interface PlatformOrganizationDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  billing_email: string | null;
  trial_ends_at: string | null;
  suspended_at: string | null;
  created_at: string;
  metrics: {
    users: number;
    contracts: number;
    tasks: number;
    last_activity_at: string | null;
  };
}

interface PlatformOrganizationDetailPanelProps {
  organizationId: string;
}

export function PlatformOrganizationDetailPanel({
  organizationId,
}: PlatformOrganizationDetailPanelProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState<PlatformOrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/platform/organizations/${organizationId}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al cargar.");
      }
      setOrganization(payload.organization ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpdate(patch: Partial<PlatformOrganizationDetail>) {
    if (!organization) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/platform/organizations/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "No se pudo actualizar.");
      }
      setOrganization(payload.organization);
      setMessage("Organización actualizada.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateOwner(event: React.FormEvent) {
    event.preventDefault();
    setIsCreatingOwner(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/platform/organizations/${organizationId}/owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ownerEmail,
          password: ownerPassword,
          full_name: ownerName,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "No se pudo crear el owner.");
      }
      setOwnerEmail("");
      setOwnerPassword("");
      setOwnerName("");
      setMessage(`Owner creado: ${payload.owner.email}`);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error al crear owner.");
    } finally {
      setIsCreatingOwner(false);
    }
  }

  if (isLoading) {
    return (
      <AppPageLayout
        width="standard"
        header={
          <PageHeader
            label="Plataforma Vertia"
            title="Cargando estudio..."
            subtitle="Recuperando plan, estado y métricas agregadas."
          />
        }
      >
        <div className="corp-panel p-6">
          <p className="text-sm text-corp-muted" role="status">
            Cargando organización…
          </p>
        </div>
      </AppPageLayout>
    );
  }

  if (!organization) {
    return (
      <AppPageLayout
        width="standard"
        header={
          <>
            <PageBreadcrumb
              items={[
                { label: "Plataforma SaaS", href: "/platform/organizaciones" },
                { label: "Organizaciones", href: "/platform/organizaciones" },
                { label: "No encontrada" },
              ]}
            />
            <PageHeader
              label="Plataforma Vertia"
              title="Estudio no encontrado"
              subtitle="La organización solicitada no existe o no tenés acceso."
            />
          </>
        }
      >
        {error ? <CorpAlert>{error}</CorpAlert> : null}
        <Link href="/platform/organizaciones" className="corp-btn-primary inline-block">
          Volver al listado
        </Link>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout
      width="standard"
      header={
        <>
          <PageBreadcrumb
            items={[
              { label: "Plataforma SaaS", href: "/platform/organizaciones" },
              { label: "Organizaciones", href: "/platform/organizaciones" },
              { label: organization.name },
            ]}
          />
          <PageHeader
            label="Plataforma Vertia"
            title={organization.name}
            subtitle={`Estudio cliente · slug ${organization.slug}. Gestioná plan, estado y owner. Sin acceso a contratos.`}
            actions={
              <Link href="/platform/organizaciones" className="corp-btn">
                Volver al listado
              </Link>
            }
          />
        </>
      }
    >
      {error ? <CorpAlert>{error}</CorpAlert> : null}
      {message ? <CorpAlert variant="success">{message}</CorpAlert> : null}

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Usuarios"
          value={organization.metrics.users}
          accent="bg-emerald-500"
          variant="panel"
        />
        <StatCard
          label="Documentos"
          value={organization.metrics.contracts}
          accent="bg-cyan-500"
          variant="panel"
        />
        <StatCard
          label="Tareas"
          value={organization.metrics.tasks}
          accent="bg-sky-500"
          variant="panel"
        />
      </section>

      <section className="corp-panel p-5">
        <p className="corp-label text-emerald-700">Ciclo de vida comercial</p>
        <h2 className="mt-1 text-lg font-semibold text-corp-text">Plan y estado</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="corp-label text-emerald-700">Estado</span>
            <select
              value={organization.status}
              disabled={isSaving}
              onChange={(event) => void handleUpdate({ status: event.target.value })}
              className="corp-input w-full"
            >
              <option value="trial">Trial</option>
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="corp-label text-emerald-700">Plan</span>
            <select
              value={organization.plan}
              disabled={isSaving}
              onChange={(event) => void handleUpdate({ plan: event.target.value })}
              className="corp-input w-full"
            >
              <option value="pilot">Pilot</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs text-corp-muted">
          Política de privacidad: la plataforma no expone texto contractual ni PDFs. Solo métricas
          agregadas.
        </p>
      </section>

      <section className="corp-panel p-5">
        <p className="corp-label text-emerald-700">Administración del estudio</p>
        <h2 className="mt-1 text-lg font-semibold text-corp-text">
          Owner / administrador inicial
        </h2>
        <p className="mt-2 text-sm text-corp-muted">
          Este usuario operará en Mi estudio (configuración y usuarios internos), no en Plataforma
          SaaS.
        </p>
        <form onSubmit={handleCreateOwner} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="corp-label text-emerald-700">Nombre</span>
            <input
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              className="corp-input w-full"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="corp-label text-emerald-700">Email</span>
            <input
              type="email"
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              className="corp-input w-full"
              required
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="corp-label text-emerald-700">Contraseña temporal</span>
            <input
              type="password"
              value={ownerPassword}
              onChange={(event) => setOwnerPassword(event.target.value)}
              className="corp-input w-full"
              minLength={8}
              required
            />
          </label>
          <div>
            <button type="submit" disabled={isCreatingOwner} className="corp-btn-primary">
              {isCreatingOwner ? "Creando…" : "Crear owner admin del estudio"}
            </button>
          </div>
        </form>
      </section>
    </AppPageLayout>
  );
}
