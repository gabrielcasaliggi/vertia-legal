import { PageHeader } from "@/components/clm/PageHeader";
import { OrganizationSettingsPanel } from "@/components/clm/OrganizationSettingsPanel";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";

export default async function OrganizationAdminPage() {
  try {
    await requireAdminProfile();
  } catch {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageHeader
        label="Administración"
        title="Organización del estudio"
        subtitle="Branding, contacto y textos legales para reportes e informes."
      />
      <main className="mx-auto max-w-[800px] p-5">
        <section className="corp-panel p-6">
          <OrganizationSettingsPanel />
        </section>
      </main>
    </div>
  );
}
