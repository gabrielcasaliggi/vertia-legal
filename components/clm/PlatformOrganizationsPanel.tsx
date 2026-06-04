"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { CorpSkeletonGrid } from "@/components/clm/CorpSkeleton";
import { PageBreadcrumb } from "@/components/clm/PageBreadcrumb";
import { PageHeader } from "@/components/clm/PageHeader";
import { StatCard } from "@/components/clm/StatCard";

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
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (status === "suspended") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-red-200 bg-red-50 text-red-800";
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

  const totalUsers = organizations.reduce((sum, org) => sum + org.metrics.users, 0);
  const totalContracts = organizations.reduce((sum, org) => sum + org.metrics.contracts, 0);
  const activeOrgs = organizations.filter(
    (org) => org.status === "active" || org.status === "trial",
  ).length;

  return (
    <AppPageLayout
      width="wide"
      className="max-w-[1400px]"
      header={
        <>
          <PageBreadcrumb
            items={[
              { label: "Plataforma SaaS", href: "/platform/organizaciones" },
              { label: "Organizaciones" },
            ]}
          />
          <PageHeader
            label="Plataforma Vertia"
            title="Alta de estudios clientes"
            subtitle="Solo administradores de plataforma. Creá estudios nuevos y su primer administrador (owner). Sin acceso a contratos ni PDFs de clientes."
          />
        </>
      }
    >
      <CorpAlert variant="success" title="Roles en Vertia Legal">
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>
            <strong>Vertia (plataforma)</strong>: creás estudios clientes en esta pantalla.
          </li>
          <li>
            <strong>Owner del estudio</strong>: configura su estudio y crea usuarios en Mi estudio.
          </li>
          <li>
            <strong>Usuarios del estudio</strong>: operan documentos, tareas y reportes.
          </li>
        </ul>
      </CorpAlert>

      {!isLoading && organizations.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Estudios activos"
            value={activeOrgs}
            hint={`${organizations.length} registrados`}
            accent="bg-emerald-500"
            variant="panel"
          />
          <StatCard
            label="Usuarios totales"
            value={totalUsers}
            accent="bg-cyan-500"
            variant="panel"
          />
          <StatCard
            label="Documentos indexados"
            value={totalContracts}
            hint="Métricas agregadas"
            accent="bg-sky-500"
            variant="panel"
          />
        </section>
      ) : null}

      <section className="corp-panel ops-panel-accent p-5">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <WizardStepBadge step={1} label="Crear estudio cliente" active={wizardStep === 1} done={wizardStep === 2} />
          <span className="text-corp-muted">→</span>
          <WizardStepBadge step={2} label="Crear owner inicial" active={wizardStep === 2} done={false} />
          <span className="text-corp-muted">→</span>
          <span className="text-sm text-corp-muted">El owner opera en Mi estudio</span>
        </div>

        {wizardStep === 1 ? (
          <>
            <h2 className="text-lg font-semibold text-corp-text">Paso 1 · Crear estudio cliente</h2>
            <p className="mt-1 mb-4 text-sm text-corp-muted">
              Definí el plan comercial y el estado inicial del nuevo cliente SaaS.
            </p>
            <form onSubmit={handleCreateOrganization} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="corp-label text-emerald-700">Nombre del estudio</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="corp-input w-full"
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="corp-label text-emerald-700">Slug (opcional)</span>
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="se genera desde el nombre"
                  className="corp-input w-full"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="corp-label text-emerald-700">Email de facturación</span>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(event) => setBillingEmail(event.target.value)}
                  className="corp-input w-full"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="corp-label text-emerald-700">Plan</span>
                <select
                  value={plan}
                  onChange={(event) => setPlan(event.target.value)}
                  className="corp-input w-full"
                >
                  <option value="pilot">Pilot</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="corp-label text-emerald-700">Estado inicial</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="corp-input w-full"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Activa</option>
                </select>
              </label>
              <div className="flex items-end">
                <button type="submit" disabled={isCreatingOrg} className="corp-btn-primary">
                  {isCreatingOrg ? "Creando estudio…" : "Continuar al paso 2"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-corp-text">Paso 2 · Owner inicial del estudio</h2>
            <p className="mt-1 mb-4 text-sm text-corp-muted">
              Este usuario será administrador del estudio{" "}
              <strong className="text-corp-text">{createdOrg?.name}</strong> (
              <span className="font-mono">{createdOrg?.slug}</span>). Podrá entrar a Mi estudio y
              crear su equipo.
            </p>
            <form onSubmit={handleCreateOwner} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="corp-label text-emerald-700">Nombre del owner</span>
                <input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className="corp-input w-full"
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="corp-label text-emerald-700">Email de acceso</span>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  className="corp-input w-full"
                  required
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="corp-label text-emerald-700">
                  Contraseña temporal (mín. 8 caracteres)
                </span>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(event) => setOwnerPassword(event.target.value)}
                  minLength={8}
                  className="corp-input w-full"
                  required
                />
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button type="submit" disabled={isCreatingOwner} className="corp-btn-primary">
                  {isCreatingOwner ? "Creando owner…" : "Finalizar alta del cliente"}
                </button>
                <button type="button" onClick={() => setWizardStep(1)} className="corp-btn">
                  Volver al paso 1
                </button>
                {createdOrg ? (
                  <Link href={`/platform/organizaciones/${createdOrg.id}`} className="corp-btn">
                    Ver detalle del estudio
                  </Link>
                ) : null}
              </div>
            </form>
          </>
        )}
      </section>

      {success ? <CorpAlert variant="success">{success}</CorpAlert> : null}
      {error ? <CorpAlert>{error}</CorpAlert> : null}

      <section className="corp-panel overflow-hidden">
        <div className="border-b border-corp-border px-5 py-4">
          <p className="corp-label text-emerald-700">Cartera SaaS</p>
          <h2 className="mt-1 text-lg font-semibold text-corp-text">Estudios clientes registrados</h2>
          <p className="mt-1 text-sm text-corp-muted">
            Métricas agregadas por estudio. Sin acceso a documentos contractuales.
          </p>
        </div>
        {isLoading ? (
          <div className="p-5">
            <CorpSkeletonGrid count={3} itemClassName="h-16" />
          </div>
        ) : organizations.length === 0 ? (
          <p className="px-5 py-8 text-sm text-corp-muted">
            Todavía no hay estudios clientes. Usá el asistente de arriba para dar de alta el primero.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-corp-border bg-corp-surface text-corp-muted">
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
                  <tr key={organization.id} className="border-t border-corp-border">
                    <td className="px-5 py-4">
                      <div className="font-medium text-corp-text">{organization.name}</div>
                      <div className="text-xs text-corp-muted">{organization.slug}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`corp-badge ${statusBadgeClass(organization.status)}`}>
                        {STATUS_LABELS[organization.status] ?? organization.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-corp-text">
                      {PLAN_LABELS[organization.plan] ?? organization.plan}
                    </td>
                    <td className="px-5 py-4 text-corp-text">{organization.metrics.users}</td>
                    <td className="px-5 py-4 text-corp-text">{organization.metrics.contracts}</td>
                    <td className="px-5 py-4 text-corp-text">{organization.metrics.tasks}</td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/platform/organizaciones/${organization.id}`}
                        className="font-medium text-cyan-800 hover:text-cyan-950 hover:underline"
                      >
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppPageLayout>
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
      <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-900 ring-emerald-200`}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[10px]">
          ✓
        </span>
        {label}
      </span>
    );
  }
  if (active) {
    return (
      <span className={`${base} border-cyan-200 bg-cyan-50 text-cyan-900 ring-cyan-200`}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-100 text-[10px]">
          {step}
        </span>
        {label}
      </span>
    );
  }
  return (
    <span className={`${base} border-corp-border bg-corp-surface text-corp-muted ring-corp-border`}>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[10px]">
        {step}
      </span>
      {label}
    </span>
  );
}
