import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/auth/roles";

export type OrganizationMemberRole = "owner" | "admin" | "member";

/** Rol en `organization_members` según el rol operativo del estudio (`profiles.role`). */
export function mapProfileRoleToOrgMemberRole(profileRole: UserRole): OrganizationMemberRole {
  if (profileRole === "admin") {
    return "owner";
  }
  return "member";
}

export async function syncOrganizationMembership(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  options: { profileRole: UserRole; isActive: boolean },
): Promise<void> {
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

/** @deprecated Usar syncOrganizationMembership con organizationId explícito */
export async function syncDefaultOrganizationMembership(
  supabase: SupabaseClient,
  userId: string,
  options: { profileRole: UserRole; isActive: boolean },
): Promise<void> {
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "default")
    .maybeSingle();

  if (!data?.id) {
    return;
  }

  await syncOrganizationMembership(supabase, data.id, userId, options);
}
