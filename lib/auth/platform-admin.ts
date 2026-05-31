import { getCurrentProfile } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function isPlatformAdmin(userId?: string): Promise<boolean> {
  const profile = userId ? null : await getCurrentProfile();
  const id = userId ?? profile?.id;
  if (!id) {
    return false;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function requirePlatformAdmin(): Promise<{ id: string; email: string }> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("No autorizado.");
  }

  const allowed = await isPlatformAdmin(profile.id);
  if (!allowed) {
    throw new Error("Se requiere acceso de plataforma Vertia.");
  }

  return { id: profile.id, email: profile.email };
}
