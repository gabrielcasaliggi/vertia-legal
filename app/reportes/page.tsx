import { ReportesContent } from "@/app/reportes/ReportesContent";
import { getCurrentProfile } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/roles";

export default async function ReportesPage() {
  const profile = await getCurrentProfile();
  const userRole: UserRole = profile?.role ?? "assistant";

  return <ReportesContent userRole={userRole} />;
}
