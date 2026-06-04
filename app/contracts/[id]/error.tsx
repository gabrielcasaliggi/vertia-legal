"use client";

import Link from "next/link";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { CorpAlert } from "@/components/clm/CorpAlert";
import { PageHeader } from "@/components/clm/PageHeader";

export default function ContractDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppPageLayout
      header={
        <PageHeader
          label="Expediente"
          title="Error al cargar expediente"
          subtitle="No se pudo recuperar el detalle del documento."
        />
      }
    >
      <CorpAlert title="Fallo de carga">
        Ocurrió un error al abrir este expediente. Podés reintentar o volver al registro
        documental.
      </CorpAlert>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="corp-btn-primary">
          Reintentar
        </button>
        <Link href="/contracts" className="corp-btn">
          Volver a Documentos
        </Link>
      </div>
    </AppPageLayout>
  );
}
