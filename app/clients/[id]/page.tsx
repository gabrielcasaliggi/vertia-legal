import { Client360Panel } from "@/components/clm/Client360Panel";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-corp-bg p-5">
      <div className="mx-auto max-w-[1200px]">
        <Client360Panel clientId={id} />
      </div>
    </div>
  );
}
