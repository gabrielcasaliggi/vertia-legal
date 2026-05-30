import { PageHeader } from "@/components/clm/PageHeader";
import { getCurrentOrganization } from "@/lib/auth/organization";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";

export default async function OrganizationAdminPage() {
  try {
    await requireAdminProfile();
  } catch {
    redirect("/");
  }

  const organization = await getCurrentOrganization();

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageHeader
        label="Administración"
        title="Organización del estudio"
        subtitle="Contexto multi-tenant para aislar datos del estudio en producción."
      />
      <main className="mx-auto max-w-[800px] p-5">
        <section className="corp-panel p-6">
          {organization ? (
            <>
              <p className="corp-label">Organización activa</p>
              <p className="mt-2 text-xl font-semibold text-corp-text">{organization.name}</p>
              <p className="mt-1 text-sm text-corp-muted">Slug: {organization.slug}</p>
              <p className="mt-4 text-sm text-corp-muted">
                Los documentos, clientes y tareas nuevos se asocian a esta organización.
                Para vender a múltiples estudios, creá organizaciones adicionales y
                membresías por usuario.
              </p>
            </>
          ) : (
            <p className="text-sm text-corp-muted">
              No hay organización configurada. Aplicá la migración 014 en Supabase.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
