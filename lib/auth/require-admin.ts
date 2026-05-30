import { requireCurrentProfile } from "@/lib/auth/session";
import type { UserProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/roles";

export async function requireAdminProfile(): Promise<UserProfile> {
  const profile = await requireCurrentProfile();
  if (!canManageUsers(profile.role)) {
    throw new Error("Se requiere rol administrador.");
  }
  return profile;
}
