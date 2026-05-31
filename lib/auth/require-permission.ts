import {
  hasPermission,
  permissionDeniedMessage,
  type Permission,
} from "@/lib/auth/permissions";
import { requireCurrentProfile, type UserProfile } from "@/lib/auth/session";

export async function requirePermission(permission: Permission): Promise<UserProfile> {
  const profile = await requireCurrentProfile();
  if (!hasPermission(profile.role, permission)) {
    throw new Error(permissionDeniedMessage(permission));
  }
  return profile;
}
