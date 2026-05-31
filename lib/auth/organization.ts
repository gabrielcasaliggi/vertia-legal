import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getActiveOrganization,
  requireActiveOrganizationId,
  resolveActiveOrganizationId,
} from "@/lib/auth/active-organization";

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
}

export async function getCurrentOrganizationId(): Promise<string | null> {
  return resolveActiveOrganizationId();
}

export async function getCurrentOrganization(): Promise<UserOrganization | null> {
  const active = await getActiveOrganization();
  if (!active) {
    return null;
  }

  return {
    id: active.id,
    name: active.name,
    slug: active.slug,
  };
}

export async function requireOrganizationId(): Promise<string> {
  return requireActiveOrganizationId();
}

export async function assertOrganizationOperational(organizationId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("status")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Organización no encontrada.");
  }

  if (data.status === "suspended" || data.status === "cancelled") {
    throw new Error(
      "La organización está suspendida o cancelada. Contactá a Vertia Legal para reactivar el acceso.",
    );
  }
}
