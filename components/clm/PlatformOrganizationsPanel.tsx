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

interface CreatedOrganization {
  id: string;
  name: string;
  slug: string;
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
  const [success, setSuccess] = useState<string | null>(null);

  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [createdOrg, setCreatedOrg] = useState<CreatedOrganization | null>(null);

  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("pilot");
  const [status, setStatus] = useState("trial");
  const [billingEmail, setBillingEmail] = useState("");

  const [isCreatingOwner, setIsCreatingOwner] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

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

  function resetWizard() {
    setWizardStep(1);
    setCreatedOrg(null);
    setName("");
    setSlug("");
    setBillingEmail("");
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPassword("");
  }

  async function handleCreateOrganization(event: React.FormEvent) {
    event.preventDefault();
    setIsCreatingOrg(true);
    setError(null);
    setSuccess(null);
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

      const organization = payload.organization as CreatedOrganization;
      setCreatedOrg({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      });
      setWizardStep(2);
      setSuccess(
        `Estudio "${organization.name}" creado. Ahora definí el administrador inicial (owner) del cliente.`,
      );
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error al crear.");
    } finally {
      setIsCreatingOrg(false);
    }
  }

  async function handleCreateOwner(event: React.FormEvent) {
    event.preventDefault();
    if (!createdOrg) {
      return;
    }

    setIsCreatingOwner(true);
    setError(null);
    try {
      const response = await fetch(`/api/platform/organizations/${createdOrg.id}/owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: ownerName,
          email: ownerEmail,
          password: ownerPassword,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "No se pudo crear el owner.");
      }

      setSuccess(
        `Owner creado: ${payload.owner.email}. Ya puede ingresar, configurar el estudio en Mi estudio y crear usuarios.`,
      );
      resetWizard();
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error al crear owner.");
    } finally {
      setIsCreatingOwner(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] space-y-6 px-5 py-8">
      <PageHeader
        label="Usuario Vertia · Plataforma"
        title="Alta de estudios clientes"
        subtitle="Solo administradores de plataforma Vertia. Desde acá se crean estudios nuevos y su primer administrador (owner). No se accede a contratos ni PDFs de clientes."
      />

      <div className="rounded-corp border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
        <p className="font-medium">Roles en Vertia Legal</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-emerald-100/85">
          <li>
            <strong>Vertia (vos)</strong>: creás estudios clientes en esta pantalla.
          </li>
          <li>
            <strong>Owner del estudio</strong>: configura su estudio y crea usuarios en Mi estudio.
          </li>
          <li>
            <strong>Usuarios del estudio</strong>: operan contratos, tareas y reportes.
          </li>
        </ul>
      </div>

      <section className="rounded-corp border border-slate-800 bg-slate-950/70 p-5">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <WizardStepBadge step={1} label="Crear estudio cliente" active={wizardStep === 1} done={wizardStep === 2} />
          <span className="text-slate-600">→</span>
          <WizardStepBadge step={2} label="Crear owner inicial" active={wizardStep === 2} done={false} />
          <span className="text-slate-600">→</span>
          <span className="text-sm text-slate-400">El owner opera en Mi estudio</span>
        </div>

        {wizardStep === 1 ? (
          <>
            <h2 className="mb-1 text-lg font-semibold text-cyan-100">Paso 1 · Crear estudio cliente</h2>
            <p className="mb-4 text-sm text-slate-400">
              Definí el plan comercial y el estado inicial del nuevo cliente SaaS.
            </p>
            <form onSubmit={handleCreateOrganization} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Nombre del estudio</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Slug (opcional)</span>
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="se genera desde el nombre"
                  className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Email de facturación</span>
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
                  disabled={isCreatingOrg}
                  className="rounded-corp bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 ring-1 ring-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-60"
                >
                  {isCreatingOrg ? "Creando estudio…" : "Continuar al paso 2"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-lg font-semibold text-cyan-100">Paso 2 · Owner inicial del estudio</h2>
            <p className="mb-4 text-sm text-slate-400">
              Este usuario será administrador del estudio{" "}
              <strong className="text-slate-200">{createdOrg?.name}</strong> (
              <span className="font-mono">{createdOrg?.slug}</span>). Podrá entrar a Mi estudio y
              crear su equipo.
            </p>
            <form onSubmit={handleCreateOwner} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Nombre del owner</span>
                <input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Email de acceso</span>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  required
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-slate-300">Contraseña temporal (mín. 8 caracteres)</span>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(event) => setOwnerPassword(event.target.value)}
                  minLength={8}
                  className="w-full rounded-corp border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  required
                />
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button
                  type="submit"
                  disabled={isCreatingOwner}
                  className="rounded-corp bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-60"
                >
                  {isCreatingOwner ? "Creando owner…" : "Finalizar alta del cliente"}
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="rounded-corp border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Volver al paso 1
                </button>
                {createdOrg ? (
                  <Link
                    href={`/platform/organizaciones/${createdOrg.id}`}
                    className="rounded-corp border border-slate-700 px-4 py-2 text-sm text-cyan-300 hover:text-cyan-100"
                  >
                    Ver detalle del estudio
                  </Link>
                ) : null}
              </div>
            </form>
          </>
        )}
      </section>

      {success ? (
        <div className="rounded-corp border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-corp border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-corp border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-100">Estudios clientes registrados</h2>
          <p className="mt-1 text-sm text-slate-400">
            Métricas agregadas por estudio. Sin acceso a documentos contractuales.
          </p>
        </div>
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-slate-400">Cargando…</p>
        ) : organizations.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400">
            Todavía no hay estudios clientes. Usá el asistente de arriba para dar de alta el primero.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Estudio</th>
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
                        Gestionar plan / owner
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

function WizardStepBadge({
  step,
  label,
  active,
  done,
}: {
  step: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1";
  if (done) {
    return (
      <span className={`${base} bg-emerald-500/15 text-emerald-100 ring-emerald-400/30`}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/30 text-[10px]">
          ✓
        </span>
        {label}
      </span>
    );
  }
  if (active) {
    return (
      <span className={`${base} bg-cyan-500/20 text-cyan-100 ring-cyan-400/40`}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-500/30 text-[10px]">
          {step}
        </span>
        {label}
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-900/80 text-slate-400 ring-slate-700`}>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-800 text-[10px]">
        {step}
      </span>
      {label}
    </span>
  );
}
