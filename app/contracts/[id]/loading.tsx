import { CorpSkeletonGrid } from "@/components/clm/CorpSkeleton";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { PageHeader } from "@/components/clm/PageHeader";

export default function ContractDetailLoading() {
  return (
    <AppPageLayout
      header={
        <PageHeader
          label="Expediente"
          title="Cargando expediente..."
          subtitle="Recuperando documento, metadatos e historial operativo."
        />
      }
    >
      <CorpSkeletonGrid count={2} itemClassName="h-[70vh]" />
    </AppPageLayout>
  );
}
