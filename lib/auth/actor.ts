import { getCurrentProfile } from "@/lib/auth/session";

export async function getActorDisplayName(): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return "Operador";
  }
  const name = profile.full_name.trim();
  return name.length > 0 ? name : profile.email;
}
