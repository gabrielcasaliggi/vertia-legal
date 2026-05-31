"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/clm/PageHeader";

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
    return <p className="px-5 py-8 text-sm text-slate-400">Cargando organización…</p>;
  }

  if (!organization) {
    return (
      <main className="mx-auto max-w-[1000px] px-5 py-8">
        <p className="text-sm text-rose-200">Organización no encontrada.</p>
        <Link href="/platform/organizaciones" className="mt-4 inline-block text-cyan-300">
          Volver al listado
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1000px] space-y-6 px-5 py-8">
      <PageHeader
        title={organization.name}
        subtitle={`Slug: ${organization.slug} · Métricas agregadas sin contenido contractual`}
        actions={
          <Link
            href="/platform/organizaciones"
            className="rounded-corp border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            Volver
          </Link>
        }
      />

      {error ? (
        <div className="rounded-corp border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-corp border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-corp border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Usuarios</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-100">{organization.metrics.users}</p>
        </div>
        <div className="rounded-corp border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Documentos</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-100">
            {organization.metrics.contracts}
          </p>
        </div>
        <div className="rounded-corp border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tareas</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-100">{organization.metrics.tasks}</p>
        </div>
      </section>

      <section className="rounded-corp border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Ciclo de vida comercial</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Estado</span>
            <select
              value={organization.status}
              disabled={isSaving}
              onChange={(event) => void handleUpdate({ status: event.target.value })}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              <option value="trial">Trial</option>
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Plan</span>
            <select
              value={organization.plan}
              disabled={isSaving}
              onChange={(event) => void handleUpdate({ plan: event.target.value })}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              <option value="pilot">Pilot</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Política de privacidad: la plataforma no expone texto contractual ni PDFs. Solo métricas
          agregadas.
        </p>
      </section>

      <section className="rounded-corp border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Owner inicial del estudio</h2>
        <form onSubmit={handleCreateOwner} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Nombre</span>
            <input
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Email</span>
            <input
              type="email"
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              required
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-slate-300">Contraseña temporal</span>
            <input
              type="password"
              value={ownerPassword}
              onChange={(event) => setOwnerPassword(event.target.value)}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              minLength={8}
              required
            />
          </label>
          <div>
            <button
              type="submit"
              disabled={isCreatingOwner}
              className="rounded-corp bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-60"
            >
              {isCreatingOwner ? "Creando…" : "Crear owner admin del estudio"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
