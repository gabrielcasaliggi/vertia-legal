import { createAuthServerClient } from "@/lib/supabase/server-auth";
import type { UserRole } from "@/lib/auth/roles";
import { isUserRole } from "@/lib/auth/roles";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export async function getSessionUser() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || !data.is_active) {
    return null;
  }

  const role = isUserRole(data.role) ? data.role : "assistant";

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role,
    is_active: data.is_active,
  };
}

export async function requireCurrentProfile(): Promise<UserProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("No autorizado.");
  }
  return profile;
}
