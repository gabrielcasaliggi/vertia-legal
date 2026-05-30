import { extractContractMetadataFromText } from "@/lib/contracts/metadata-extraction";
import { createContractVersion } from "@/lib/contracts/contract-versions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function reindexContractFromStorage(contractId: string): Promise<{
  extractedLength: number;
}> {
  const supabase = createServerSupabaseClient();

  const { data: contract, error: fetchError } = await supabase
    .from("legal_contracts")
    .select("id, storage_path, file_name, file_hash")
    .eq("id", contractId)
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
  const { extractTextLocally } = await import("@/lib/pdf/extract-local");
  const extractedText = await extractTextLocally(buffer);
  const metadata = extractContractMetadataFromText(extractedText);

  const { error: updateError } = await supabase
    .from("legal_contracts")
    .update({
      extracted_text: extractedText,
      starts_at: metadata.starts_at,
      expires_at: metadata.expires_at,
      lifecycle_status: metadata.lifecycle_status,
      status: "indexed",
      processing_phase: "completed",
    })
    .eq("id", contractId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { extractedLength: extractedText.length };
}

export async function replaceContractPdf(
  contractId: string,
  file: File,
  actor?: { id: string; name: string },
  organizationId?: string | null,
): Promise<{ version_number: number }> {
  const supabase = createServerSupabaseClient();
  const { createHash } = await import("crypto");
  const { getNextVersionNumber } = await import("@/lib/contracts/contract-versions");
  const { buildContractStoragePath } = await import("@/lib/storage/contract-path");
  const { extractTextLocally } = await import("@/lib/pdf/extract-local");

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileHash = createHash("sha256").update(buffer).digest("hex");
  const versionNumber = await getNextVersionNumber(contractId);
  const storagePath = buildContractStoragePath(contractId, organizationId, versionNumber);

  const { error: uploadError } = await supabase.storage
    .from("contracts")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const extractedText = await extractTextLocally(buffer);
  const metadata = extractContractMetadataFromText(extractedText);

  await createContractVersion({
    contractId,
    versionNumber,
    storagePath,
    fileHash,
    fileName: file.name,
    uploadedBy: actor?.id ?? null,
    uploadedByName: actor?.name,
    organizationId,
  });

  const { error: updateError } = await supabase
    .from("legal_contracts")
    .update({
      file_name: file.name,
      storage_path: storagePath,
      file_hash: fileHash,
      extracted_text: extractedText,
      starts_at: metadata.starts_at,
      expires_at: metadata.expires_at,
      lifecycle_status: metadata.lifecycle_status,
      status: "indexed",
      processing_phase: "completed",
    })
    .eq("id", contractId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { version_number: versionNumber };
}
