import { PlatformOrganizationDetailPanel } from "@/components/clm/PlatformOrganizationDetailPanel";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlatformOrganizationDetailPage({ params }: PageProps) {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;
  return <PlatformOrganizationDetailPanel organizationId={id} />;
}
