import type { SupabaseClient } from "@supabase/supabase-js";
import { requireOrganizationId } from "@/lib/auth/organization";
import type { Database } from "@/lib/supabase/types";

export async function requireOrganizationScope(): Promise<string> {
  return requireOrganizationId();
}

export async function assertContractInOrganization(
  supabase: SupabaseClient<Database>,
  contractId: string,
  organizationId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("legal_contracts")
    .select("id")
    .eq("id", contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Contrato no encontrado o fuera de la organización.");
  }
}

export async function assertClientInOrganization(
  supabase: SupabaseClient<Database>,
  clientId: string,
  organizationId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("studio_clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Cliente no encontrado o fuera de la organización.");
  }
}

export async function assertTaskInOrganization(
  supabase: SupabaseClient<Database>,
  taskId: string,
  organizationId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("contract_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Tarea no encontrada o fuera de la organización.");
  }
}
