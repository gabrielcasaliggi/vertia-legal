import { Suspense } from "react";
import Link from "next/link";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { ContractCompareWizard } from "@/components/clm/ContractCompareWizard";
import { PageBreadcrumb } from "@/components/clm/PageBreadcrumb";
import { PageHeader } from "@/components/clm/PageHeader";

export default function ContractComparePage() {
  return (
    <AppPageLayout
      header={
        <>
          <PageBreadcrumb
            items={[
              { label: "Documentos", href: "/contracts" },
              { label: "Comparador" },
            ]}
          />
          <PageHeader
            label="Documentos · Comparador"
            title="Comparar contratos"
            subtitle="Herramienta del registro documental para contrastar contrato base contra propuesta, versión nueva o acuerdo alternativo."
            actions={
              <Link href="/contracts" className="corp-btn">
                Volver al registro
              </Link>
            }
          />
        </>
      }
    >
      <Suspense
        fallback={
          <div className="corp-panel p-6 text-sm text-corp-muted">
            Cargando comparador...
          </div>
        }
      >
        <ContractCompareWizard />
      </Suspense>
    </AppPageLayout>
  );
}
