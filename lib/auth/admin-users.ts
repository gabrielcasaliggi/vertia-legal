import { syncDefaultOrganizationMembership } from "@/lib/auth/org-membership";
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
}

export async function listStudioUsers(): Promise<StudioUserProfile[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createStudioUser(input: {
  email: string;
  password: string;
  full_name: string;
  role: string;
}): Promise<StudioUserProfile> {
  const supabase = createServerSupabaseClient();

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

  await syncDefaultOrganizationMembership(supabase, authData.user.id, {
    profileRole: resolveProfileRole(profile.role),
    isActive: profile.is_active,
  });

  return profile;
}

export async function updateStudioUser(
  userId: string,
  patch: { full_name?: string; role?: UserRole; is_active?: boolean },
): Promise<StudioUserProfile> {
  const supabase = createServerSupabaseClient();
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
    await syncDefaultOrganizationMembership(supabase, userId, {
      profileRole: resolveProfileRole(data.role),
      isActive: data.is_active,
    });
  }

  return data;
}
