import { PageHeader } from "@/components/clm/PageHeader";
import { OrganizationSettingsPanel } from "@/components/clm/OrganizationSettingsPanel";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrganizationAdminPage() {
  let canAccessPlatform = false;

  try {
    const profile = await requireAdminProfile();
    canAccessPlatform = await isPlatformAdmin(profile.id);
  } catch {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageHeader
        label="Mi estudio"
        title="Configuración de la organización activa"
        subtitle="Esta pantalla edita únicamente el estudio con el que estás operando ahora. No crea organizaciones SaaS nuevas."
        actions={
          canAccessPlatform ? (
            <Link
              href="/platform/organizaciones"
              className="rounded-corp border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
            >
              Crear organización en Plataforma
            </Link>
          ) : null
        }
      />
      <main className="mx-auto max-w-[800px] p-5">
        <div className="mb-4 rounded-corp border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
          <p className="font-medium">Estás en el panel del estudio activo.</p>
          <p className="mt-1 text-cyan-100/80">
            Acá se ajustan branding, datos de contacto y textos legales de esta organización. Para
            crear otro estudio o administrar planes/estados, usá el panel separado de Plataforma
            SaaS.
          </p>
        </div>
        <section className="corp-panel p-6">
          <OrganizationSettingsPanel />
        </section>
      </main>
    </div>
  );
}
