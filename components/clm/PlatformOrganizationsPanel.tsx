"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/clm/PageHeader";

interface OrganizationMetrics {
  users: number;
  contracts: number;
  tasks: number;
  last_activity_at: string | null;
}

interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  billing_email: string | null;
  trial_ends_at: string | null;
  suspended_at: string | null;
  created_at: string;
  metrics: OrganizationMetrics;
}

const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Activa",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

const PLAN_LABELS: Record<string, string> = {
  pilot: "Pilot",
  professional: "Professional",
  enterprise: "Enterprise",
};

function statusBadgeClass(status: string): string {
  if (status === "active" || status === "trial") {
    return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30";
  }
  if (status === "suspended") {
    return "bg-amber-500/15 text-amber-200 ring-amber-400/30";
  }
  return "bg-rose-500/15 text-rose-200 ring-rose-400/30";
}

export function PlatformOrganizationsPanel() {
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("pilot");
  const [status, setStatus] = useState("trial");
  const [billingEmail, setBillingEmail] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/organizations");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al cargar.");
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

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          plan,
          status,
          billing_email: billingEmail || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "No se pudo crear.");
      }
      setName("");
      setSlug("");
      setBillingEmail("");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error al crear.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] space-y-6 px-5 py-8">
      <PageHeader
        title="Plataforma SaaS"
        subtitle="Administración de organizaciones Vertia Legal. Sin acceso a contenido contractual."
      />

      <section className="rounded-corp border border-slate-800 bg-slate-950/70 p-5 shadow-inner shadow-black/20">
        <h2 className="mb-4 text-lg font-semibold text-cyan-100">Nueva organización</h2>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Slug</span>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="auto desde nombre"
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Email facturación</span>
            <input
              type="email"
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.target.value)}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Plan</span>
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              <option value="pilot">Pilot</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Estado inicial</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              <option value="trial">Trial</option>
              <option value="active">Activa</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-corp bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 ring-1 ring-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-60"
            >
              {isCreating ? "Creando…" : "Crear organización"}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <div className="rounded-corp border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-corp border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-100">Organizaciones</h2>
        </div>
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-slate-400">Cargando…</p>
        ) : organizations.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400">Todavía no hay organizaciones SaaS.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Organización</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Usuarios</th>
                  <th className="px-5 py-3 font-medium">Docs</th>
                  <th className="px-5 py-3 font-medium">Tareas</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization.id} className="border-t border-slate-800/80">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-100">{organization.name}</div>
                      <div className="text-xs text-slate-500">{organization.slug}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs ring-1 ${statusBadgeClass(organization.status)}`}
                      >
                        {STATUS_LABELS[organization.status] ?? organization.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {PLAN_LABELS[organization.plan] ?? organization.plan}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{organization.metrics.users}</td>
                    <td className="px-5 py-4 text-slate-300">{organization.metrics.contracts}</td>
                    <td className="px-5 py-4 text-slate-300">{organization.metrics.tasks}</td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/platform/organizaciones/${organization.id}`}
                        className="text-cyan-300 hover:text-cyan-100"
                      >
                        Administrar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
