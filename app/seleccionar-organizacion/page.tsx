import { OrganizationSelectorPanel } from "@/components/clm/OrganizationSelectorPanel";
import { listUserOrganizations } from "@/lib/auth/active-organization";
import { getCurrentProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SelectOrganizationPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const memberships = await listUserOrganizations();
  if (memberships.length <= 1) {
    redirect("/");
  }

  return <OrganizationSelectorPanel />;
}
