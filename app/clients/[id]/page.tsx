import { Client360Panel } from "@/components/clm/Client360Panel";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Client360Panel clientId={id} />;
}
