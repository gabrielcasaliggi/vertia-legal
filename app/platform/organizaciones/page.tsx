import { PlatformOrganizationsPanel } from "@/components/clm/PlatformOrganizationsPanel";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { redirect } from "next/navigation";

export default async function PlatformOrganizationsPage() {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/");
  }

  return <PlatformOrganizationsPanel />;
}
