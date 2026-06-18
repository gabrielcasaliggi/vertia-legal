import { Suspense } from "react";
import { ContractDetailPanel } from "@/components/clm/ContractDetailPanel";

interface ContractPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractPage({ params }: ContractPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-6 text-sm text-corp-muted">Cargando expediente…</p>}>
      <ContractDetailPanel contractId={id} />
    </Suspense>
  );
}
