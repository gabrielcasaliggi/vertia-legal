import { computeDaysUntilExpiry } from "@/lib/contracts/lifecycle";
import type { Client360Summary, Matter, StudioClient } from "@/lib/clients/studio-clients";
import { getCurrentOrganizationId } from "@/lib/auth/organization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ContractListItem } from "@/lib/supabase/types";

export interface Client360Payload {
  summary: Client360Summary;
  contracts: ContractListItem[];
  matters: Matter[];
}

export async function listStudioClients(): Promise<StudioClient[]> {
  const supabase = createServerSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  let query = supabase.from("studio_clients").select("*").order("name", { ascending: true });

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getClient360(clientId: string): Promise<Client360Payload> {
  const supabase = createServerSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  let clientQuery = supabase.from("studio_clients").select("*").eq("id", clientId);
  if (organizationId) {
    clientQuery = clientQuery.eq("organization_id", organizationId);
  }

  const { data: client, error: clientError } = await clientQuery.maybeSingle();

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (!client) {
    throw new Error("Cliente no encontrado.");
  }

  let contractsQuery = supabase
    .from("legal_contracts")
    .select(
      "id, file_name, client_name, folder_name, status, file_hash, created_at, starts_at, expires_at, contract_type, party_a, party_b, lifecycle_status",
    )
    .or(`client_id.eq.${clientId},client_name.eq.${client.name}`)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (organizationId) {
    contractsQuery = contractsQuery.eq("organization_id", organizationId);
  }

  const [{ data: matters }, { data: contracts }, { count: taskCount }] = await Promise.all([
    supabase.from("matters").select("*").eq("client_id", clientId).order("name"),
    contractsQuery,
    supabase
      .from("contract_tasks")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["pending", "in_progress"]),
  ]);

  const contractRows = contracts ?? [];
  const contractIds = contractRows.map((row) => row.id);

  let obligationCount = 0;
  if (contractIds.length > 0) {
    const { count } = await supabase
      .from("contract_obligations")
      .select("id", { count: "exact", head: true })
      .neq("status", "completed")
      .in("contract_id", contractIds);
    obligationCount = count ?? 0;
  }
  const expiringCount = contractRows.filter((row) => {
    const days = computeDaysUntilExpiry(row.expires_at);
    return days !== null && days >= 0 && days <= 90;
  }).length;

  const summary: Client360Summary = {
    client,
    matters: matters ?? [],
    contractCount: contractRows.length,
    expiringCount,
    pendingObligations: obligationCount ?? 0,
    openTasks: taskCount ?? 0,
  };

  return {
    summary,
    contracts: contractRows,
    matters: matters ?? [],
  };
}

export async function findOrCreateClientByName(
  name: string,
  organizationId?: string | null,
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed || trimmed === "General") {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const orgId = organizationId ?? (await getCurrentOrganizationId());

  let existingQuery = supabase
    .from("studio_clients")
    .select("id")
    .ilike("name", trimmed)
    .limit(1);

  if (orgId) {
    existingQuery = existingQuery.eq("organization_id", orgId);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("studio_clients")
    .insert({
      name: trimmed,
      organization_id: orgId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[studio_clients] create failed:", error.message);
    return null;
  }

  return created.id;
}
