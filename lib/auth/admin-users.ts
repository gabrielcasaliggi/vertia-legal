import { syncOrganizationMembership } from "@/lib/auth/org-membership";
import { requireOrganizationId } from "@/lib/auth/organization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/roles";
import { isUserRole } from "@/lib/auth/roles";

function resolveProfileRole(role: string): UserRole {
  return isUserRole(role) ? role : "assistant";
}

export interface StudioUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  member_role?: string;
}

export async function listStudioUsers(organizationId?: string): Promise<StudioUserProfile[]> {
  const supabase = createServerSupabaseClient();
  const orgId = organizationId ?? (await requireOrganizationId());

  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id, role, is_active")
    .eq("organization_id", orgId);

  if (membersError) {
    throw new Error(membersError.message);
  }

  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .in("id", userIds)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const memberMap = new Map((members ?? []).map((m) => [m.user_id, m]));

  return (profiles ?? []).map((profile) => ({
    ...profile,
    member_role: memberMap.get(profile.id)?.role,
    is_active: profile.is_active && (memberMap.get(profile.id)?.is_active ?? true),
  }));
}

export async function createStudioUser(input: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  organizationId?: string;
}): Promise<StudioUserProfile> {
  const supabase = createServerSupabaseClient();
  const orgId = input.organizationId ?? (await requireOrganizationId());

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name.trim(),
      role: input.role,
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "No se pudo crear el usuario.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Usuario creado sin perfil.");
  }

  await syncOrganizationMembership(supabase, orgId, authData.user.id, {
    profileRole: resolveProfileRole(profile.role),
    isActive: profile.is_active,
  });

  return profile;
}

export async function updateStudioUser(
  userId: string,
  patch: { full_name?: string; role?: UserRole; is_active?: boolean },
  organizationId?: string,
): Promise<StudioUserProfile> {
  const supabase = createServerSupabaseClient();
  const orgId = organizationId ?? (await requireOrganizationId());

  const updatePayload: {
    full_name?: string;
    role?: UserRole;
    is_active?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (patch.full_name !== undefined) {
    updatePayload.full_name = patch.full_name;
  }
  if (patch.role !== undefined && isUserRole(patch.role)) {
    updatePayload.role = patch.role;
  }
  if (patch.is_active !== undefined) {
    updatePayload.is_active = patch.is_active;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select("id, email, full_name, role, is_active, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo actualizar el usuario.");
  }

  if (patch.role !== undefined || patch.is_active !== undefined) {
    await syncOrganizationMembership(supabase, orgId, userId, {
      profileRole: resolveProfileRole(data.role),
      isActive: data.is_active,
    });

    if (patch.is_active !== undefined) {
      await supabase
        .from("organization_members")
        .update({ is_active: patch.is_active })
        .eq("organization_id", orgId)
        .eq("user_id", userId);
    }
  }

  return data;
}
