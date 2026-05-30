import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ContractVersionRecord {
  id: string;
  contract_id: string;
  version_number: number;
  storage_path: string;
  file_hash: string;
  file_name: string;
  uploaded_by_name: string | null;
  created_at: string;
}

export async function getNextVersionNumber(contractId: string): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("contract_versions")
    .select("version_number")
    .eq("contract_id", contractId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.version_number ?? 0) + 1;
}

export async function createContractVersion(input: {
  contractId: string;
  versionNumber: number;
  storagePath: string;
  fileHash: string;
  fileName: string;
  uploadedBy?: string | null;
  uploadedByName?: string;
  organizationId?: string | null;
}): Promise<ContractVersionRecord> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contract_versions")
    .insert({
      contract_id: input.contractId,
      version_number: input.versionNumber,
      storage_path: input.storagePath,
      file_hash: input.fileHash,
      file_name: input.fileName,
      uploaded_by: input.uploadedBy ?? null,
      uploaded_by_name: input.uploadedByName ?? null,
      organization_id: input.organizationId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo registrar la versión.");
  }

  return data as ContractVersionRecord;
}

export async function fetchContractVersions(
  contractId: string,
): Promise<ContractVersionRecord[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contract_versions")
    .select("*")
    .eq("contract_id", contractId)
    .order("version_number", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContractVersionRecord[];
}
