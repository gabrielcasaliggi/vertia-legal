"use client";

import { useCallback, useEffect, useState } from "react";

interface OrganizationFormState {
  name: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
  report_responsible_name: string;
  report_disclaimer: string;
}

export function OrganizationSettingsPanel() {
  const [form, setForm] = useState<OrganizationFormState>({
    name: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "",
    report_responsible_name: "",
    report_disclaimer: "",
  });
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/organization");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al cargar.");
      }
      const organization = payload.organization;
      if (organization) {
        setForm({
          name: organization.name ?? "",
          contact_email: organization.contact_email ?? "",
          contact_phone: organization.contact_phone ?? "",
          logo_url: organization.logo_url ?? "",
          report_responsible_name: organization.report_responsible_name ?? "",
          report_disclaimer: organization.report_disclaimer ?? "",
        });
        setSlug(organization.slug ?? "");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "No se pudo guardar.");
      }
      setMessage("Configuración del estudio actualizada.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-corp-muted">Cargando configuración...</p>;
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <p className="text-sm text-corp-muted">
        Slug interno: <span className="font-mono text-corp-text">{slug || "default"}</span>
      </p>

      <label className="block space-y-1">
        <span className="corp-label text-[11px]">Nombre del estudio</span>
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className="corp-input w-full"
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="corp-label text-[11px]">Email de contacto</span>
          <input
            type="email"
            value={form.contact_email}
            onChange={(event) =>
              setForm((current) => ({ ...current, contact_email: event.target.value }))
            }
            className="corp-input w-full"
          />
        </label>
        <label className="block space-y-1">
          <span className="corp-label text-[11px]">Teléfono</span>
          <input
            value={form.contact_phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, contact_phone: event.target.value }))
            }
            className="corp-input w-full"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="corp-label text-[11px]">Logo (URL)</span>
        <input
          value={form.logo_url}
          onChange={(event) => setForm((current) => ({ ...current, logo_url: event.target.value }))}
          placeholder="https://..."
          className="corp-input w-full"
        />
      </label>

      <label className="block space-y-1">
        <span className="corp-label text-[11px]">Responsable en reportes</span>
        <input
          value={form.report_responsible_name}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              report_responsible_name: event.target.value,
            }))
          }
          className="corp-input w-full"
        />
      </label>

      <label className="block space-y-1">
        <span className="corp-label text-[11px]">Disclaimer legal en reportes</span>
        <textarea
          value={form.report_disclaimer}
          onChange={(event) =>
            setForm((current) => ({ ...current, report_disclaimer: event.target.value }))
          }
          rows={4}
          className="corp-input w-full"
        />
      </label>

      {message ? (
        <p className="rounded-corp border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-corp border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={isSaving} className="corp-btn-primary">
        {isSaving ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
