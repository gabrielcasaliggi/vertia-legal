import { extractContractMetadataFromText } from "@/lib/contracts/metadata-extraction";
import { createContractVersion } from "@/lib/contracts/contract-versions";
import {
  assertContractInOrganization,
  requireOrganizationScope,
} from "@/lib/auth/tenant-scope";
import { extractTextWithQuality } from "@/lib/pdf/index-quality";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function reindexContractFromStorage(contractId: string): Promise<{
  extractedLength: number;
  index_quality: "ok" | "insufficient_text";
  index_warning: string | null;
}> {
  const organizationId = await requireOrganizationScope();
  const supabase = createServerSupabaseClient();
  await assertContractInOrganization(supabase, contractId, organizationId);

  const { data: contract, error: fetchError } = await supabase
    .from("legal_contracts")
    .select("id, storage_path, file_name, file_hash")
    .eq("id", contractId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !contract) {
    throw new Error("Contrato no encontrado.");
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("contracts")
    .download(contract.storage_path);

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message ?? "No se pudo descargar el PDF.");
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const extraction = await extractTextWithQuality(buffer);
  const metadata = extractContractMetadataFromText(extraction.text);

  const { error: updateError } = await supabase
    .from("legal_contracts")
    .update({
      extracted_text: extraction.text,
      index_quality: extraction.quality,
      starts_at: metadata.starts_at,
      expires_at: metadata.expires_at,
      lifecycle_status: metadata.lifecycle_status,
      status: "indexed",
      processing_phase: "completed",
    })
    .eq("id", contractId)
    .eq("organization_id", organizationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    extractedLength: extraction.text.length,
    index_quality: extraction.quality,
    index_warning: extraction.warning,
  };
}

export async function replaceContractPdf(
  contractId: string,
  file: File,
  actor?: { id: string; name: string },
  organizationId?: string | null,
): Promise<{
  version_number: number;
  index_quality: "ok" | "insufficient_text";
  index_warning: string | null;
}> {
  const scopedOrganizationId = organizationId ?? (await requireOrganizationScope());
  const supabase = createServerSupabaseClient();
  await assertContractInOrganization(supabase, contractId, scopedOrganizationId);

  const { createHash } = await import("crypto");
  const { getNextVersionNumber } = await import("@/lib/contracts/contract-versions");
  const { buildContractStoragePath } = await import("@/lib/storage/contract-path");

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileHash = createHash("sha256").update(buffer).digest("hex");
  const versionNumber = await getNextVersionNumber(contractId);
  const storagePath = buildContractStoragePath(
    contractId,
    scopedOrganizationId,
    versionNumber,
  );

  const { error: uploadError } = await supabase.storage
    .from("contracts")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const extraction = await extractTextWithQuality(buffer);
  const metadata = extractContractMetadataFromText(extraction.text);

  await createContractVersion({
    contractId,
    versionNumber,
    storagePath,
    fileHash,
    fileName: file.name,
    uploadedBy: actor?.id ?? null,
    uploadedByName: actor?.name,
    organizationId: scopedOrganizationId,
  });

  const { error: updateError } = await supabase
    .from("legal_contracts")
    .update({
      file_name: file.name,
      storage_path: storagePath,
      file_hash: fileHash,
      extracted_text: extraction.text,
      index_quality: extraction.quality,
      starts_at: metadata.starts_at,
      expires_at: metadata.expires_at,
      lifecycle_status: metadata.lifecycle_status,
      status: "indexed",
      processing_phase: "completed",
    })
    .eq("id", contractId)
    .eq("organization_id", scopedOrganizationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    version_number: versionNumber,
    index_quality: extraction.quality,
    index_warning: extraction.warning,
  };
}
