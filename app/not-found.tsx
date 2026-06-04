import Link from "next/link";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { PageHeader } from "@/components/clm/PageHeader";

export default function NotFound() {
  return (
    <AppPageLayout
      width="standard"
      header={
        <PageHeader
          label="Navegación"
          title="Página no encontrada"
          subtitle="La ruta solicitada no existe o fue movida."
        />
      }
    >
      <section className="corp-panel p-8 text-center">
        <p className="text-sm text-corp-muted">
          Verificá la URL o volvé al centro operativo del estudio.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/" className="corp-btn-primary">
            Ir a Inicio
          </Link>
          <Link href="/contracts" className="corp-btn">
            Ver Documentos
          </Link>
        </div>
      </section>
    </AppPageLayout>
  );
}
