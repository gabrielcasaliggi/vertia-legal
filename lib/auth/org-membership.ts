import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/auth/roles";

export type OrganizationMemberRole = "owner" | "admin" | "member";

/** Rol en `organization_members` según el rol operativo del estudio (`profiles.role`). */
export function mapProfileRoleToOrgMemberRole(profileRole: UserRole): OrganizationMemberRole {
  return profileRole === "admin" ? "owner" : "member";
}

export async function getDefaultOrganizationId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "default")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

/** Mantiene alineado `organization_members` con el perfil en la org por defecto. */
export async function syncDefaultOrganizationMembership(
  supabase: SupabaseClient,
  userId: string,
  options: { profileRole: UserRole; isActive: boolean },
): Promise<void> {
  const organizationId = await getDefaultOrganizationId(supabase);
  if (!organizationId) {
    return;
  }

  const { error } = await supabase.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role: mapProfileRoleToOrgMemberRole(options.profileRole),
      is_active: options.isActive,
    },
    { onConflict: "organization_id,user_id" },
  );

  if (error) {
    throw new Error(`No se pudo sincronizar la organización: ${error.message}`);
  }
}
