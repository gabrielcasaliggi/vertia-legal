import { CorpSkeletonGrid } from "@/components/clm/CorpSkeleton";
import { AppPageLayout } from "@/components/clm/AppPageLayout";
import { PageHeader } from "@/components/clm/PageHeader";

export default function ClientDetailLoading() {
  return (
    <AppPageLayout
      width="standard"
      header={
        <PageHeader
          label="Cliente 360"
          title="Cargando cliente..."
          subtitle="Recuperando cartera, expedientes y tareas vinculadas."
        />
      }
    >
      <CorpSkeletonGrid count={3} itemClassName="h-40" />
    </AppPageLayout>
  );
}
