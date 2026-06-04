"use client";

import Link from "next/link";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { PageHeader } from "@/components/clm/PageHeader";

export default function ClientDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppPageLayout
      width="standard"
      header={
        <PageHeader
          label="Cliente 360"
          title="Error al cargar cliente"
          subtitle="No se pudo recuperar la vista consolidada."
        />
      }
    >
      <CorpAlert title="Fallo de carga">
        Ocurrió un error al abrir este cliente. Podés reintentar o volver al listado.
      </CorpAlert>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="corp-btn-primary">
          Reintentar
        </button>
        <Link href="/clients" className="corp-btn">
          Volver a Clientes
        </Link>
      </div>
    </AppPageLayout>
  );
}
