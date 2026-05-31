import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  report_disclaimer: string | null;
  report_responsible_name: string | null;
  updated_at: string;
}

export interface UpdateOrganizationSettingsInput {
  name?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  logo_url?: string | null;
  report_disclaimer?: string | null;
  report_responsible_name?: string | null;
}

const DEFAULT_DISCLAIMER =
  "Este informe fue generado con apoyo de Vertia Legal y no reemplaza la revisión profesional de un abogado o contador.";

export async function getOrganizationSettings(
  organizationId: string,
): Promise<OrganizationSettings | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, contact_email, contact_phone, logo_url, report_disclaimer, report_responsible_name, updated_at",
    )
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function updateOrganizationSettings(
  organizationId: string,
  input: UpdateOrganizationSettingsInput,
): Promise<OrganizationSettings> {
  const supabase = createServerSupabaseClient();
  const payload: UpdateOrganizationSettingsInput & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    payload.name = input.name.trim();
  }
  if (input.contact_email !== undefined) {
    payload.contact_email = input.contact_email?.trim() || null;
  }
  if (input.contact_phone !== undefined) {
    payload.contact_phone = input.contact_phone?.trim() || null;
  }
  if (input.logo_url !== undefined) {
    payload.logo_url = input.logo_url?.trim() || null;
  }
  if (input.report_disclaimer !== undefined) {
    payload.report_disclaimer = input.report_disclaimer?.trim() || DEFAULT_DISCLAIMER;
  }
  if (input.report_responsible_name !== undefined) {
    payload.report_responsible_name = input.report_responsible_name?.trim() || null;
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(payload)
    .eq("id", organizationId)
    .select(
      "id, name, slug, contact_email, contact_phone, logo_url, report_disclaimer, report_responsible_name, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo actualizar la organización.");
  }

  return data;
}

export function resolveReportDisclaimer(settings: OrganizationSettings | null): string {
  return settings?.report_disclaimer?.trim() || DEFAULT_DISCLAIMER;
}

export function resolveReportBrandName(settings: OrganizationSettings | null): string {
  return settings?.name?.trim() || "Vertia Legal";
}
