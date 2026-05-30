import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
}

export async function getCurrentOrganizationId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(id, name, slug)")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data?.organization_id) {
    const { data: defaultOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", "default")
      .maybeSingle();
    return defaultOrg?.id ?? null;
  }

  return data.organization_id;
}

export async function getCurrentOrganization(): Promise<UserOrganization | null> {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId)
    .maybeSingle();

  return data ?? null;
}

export async function requireOrganizationId(): Promise<string> {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    throw new Error("No hay organización activa para el usuario.");
  }
  return orgId;
}
