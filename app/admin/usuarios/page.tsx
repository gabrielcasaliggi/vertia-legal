import { AdminUsersPanel } from "@/components/clm/AdminUsersPanel";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  try {
    await requireAdminProfile();
  } catch {
    redirect("/");
  }

  return <AdminUsersPanel />;
}
