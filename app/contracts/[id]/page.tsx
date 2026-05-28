import { ContractDetailPanel } from "@/components/clm/ContractDetailPanel";

interface ContractPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractPage({ params }: ContractPageProps) {
  const { id } = await params;
  return <ContractDetailPanel contractId={id} />;
}
