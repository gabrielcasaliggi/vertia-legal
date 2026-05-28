import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { extractContractMetadataFromText } from "@/lib/contracts/metadata-extraction";
import type { ProcessingPhase } from "@/lib/contracts/pipeline-phases";
import { extractTextLocally, LocalExtractionError } from "@/lib/pdf/extract-local";
import { logActivity } from "@/lib/contracts/activity-log";
import { isDocumentCategory } from "@/lib/contracts/document-categories";
import { findOrCreateClientByName } from "@/lib/clients/client-360-service";
import { buildContractStoragePath } from "@/lib/storage/contract-path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, ContractIndexResponse } from "@/lib/supabase/types";

const CONTRACTS_BUCKET = "contracts";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function jsonError(
  error: string,
  status: number,
  details?: string,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status },
  );
}

function isPdfFile(file: File): boolean {
  const normalizedName = file.name.toLowerCase();
  return file.type === "application/pdf" || normalizedName.endsWith(".pdf");
}

async function cleanupContractRecord(contractId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("legal_contracts").delete().eq("id", contractId);
}

async function updateProcessingPhase(
  contractId: string,
  phase: ProcessingPhase,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase
    .from("legal_contracts")
    .update({ processing_phase: phase })
    .eq("id", contractId);
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ContractIndexResponse | ApiErrorResponse>> {
  let contractId: string | null = null;

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const clientName =
      typeof formData.get("client_name") === "string"
        ? formData.get("client_name")!.toString().trim() || "General"
        : "General";
    const folderName =
      typeof formData.get("folder_name") === "string"
        ? formData.get("folder_name")!.toString().trim() || "Expedientes"
        : "Expedientes";
    const contractType =
      typeof formData.get("contract_type") === "string"
        ? formData.get("contract_type")!.toString().trim() || null
        : null;
    const documentCategoryRaw =
      typeof formData.get("document_category") === "string"
        ? formData.get("document_category")!.toString().trim()
        : "";
    const documentCategory = isDocumentCategory(documentCategoryRaw)
      ? documentCategoryRaw
      : null;
    const actorName =
      typeof formData.get("actor_name") === "string"
        ? formData.get("actor_name")!.toString().trim() || "Operador"
        : "Operador";

    if (!(fileEntry instanceof File)) {
      return jsonError("Se requiere un archivo PDF en el campo 'file'.", 400);
    }

    if (!isPdfFile(fileEntry)) {
      return jsonError("Solo se permiten archivos PDF.", 400);
    }

    if (fileEntry.size === 0 || fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return jsonError("El PDF está vacío o excede 10 MB.", 400);
    }

    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
    contractId = randomUUID();
    const storagePath = buildContractStoragePath(contractId);

    const fileHash = createHash("sha256").update(fileBuffer).digest("hex");
    const extractedText = await extractTextLocally(fileBuffer);
    const extractedMetadata = extractContractMetadataFromText(extractedText);

    const supabase = createServerSupabaseClient();
    const linkedClientId = await findOrCreateClientByName(clientName);

    const { data: insertedContract, error: insertError } = await supabase
      .from("legal_contracts")
      .insert({
        id: contractId,
        file_name: fileEntry.name,
        storage_path: storagePath,
        file_hash: fileHash,
        extracted_text: extractedText,
        client_name: clientName,
        folder_name: folderName,
        client_id: linkedClientId,
        document_category: documentCategory,
        starts_at: extractedMetadata.starts_at,
        expires_at: extractedMetadata.expires_at,
        lifecycle_status: extractedMetadata.lifecycle_status,
        contract_type: contractType,
        status: "indexed",
        processing_phase: "registering_record",
      })
      .select(
        "id, file_name, storage_path, file_hash, client_name, folder_name, starts_at, expires_at, lifecycle_status, status, processing_phase, created_at",
      )
      .single();

    if (insertError || !insertedContract) {
      return jsonError(
        "No se pudo registrar el contrato en la base de datos.",
        500,
        insertError?.message,
      );
    }

    await updateProcessingPhase(contractId, "uploading_storage");

    const { error: uploadError } = await supabase.storage
      .from(CONTRACTS_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      await cleanupContractRecord(contractId);
      return jsonError(
        "No se pudo subir el archivo al almacenamiento.",
        500,
        uploadError.message,
      );
    }

    await updateProcessingPhase(contractId, "indexing_search");
    await updateProcessingPhase(contractId, "completed");

    await logActivity({
      action: "contract.uploaded",
      entityType: "legal_contract",
      entityId: contractId,
      entityLabel: fileEntry.name,
      actorName,
      metadata: { client_name: clientName, document_category: documentCategory },
    });

    return NextResponse.json(
      {
        id: insertedContract.id,
        file_name: insertedContract.file_name,
        storage_path: insertedContract.storage_path,
        file_hash: insertedContract.file_hash,
        client_name: insertedContract.client_name,
        folder_name: insertedContract.folder_name,
        starts_at: insertedContract.starts_at,
        expires_at: insertedContract.expires_at,
        lifecycle_status: insertedContract.lifecycle_status,
        status: "indexed",
        processing_phase: "completed",
        created_at: insertedContract.created_at,
      },
      { status: 201 },
    );
  } catch (error) {
    if (contractId) {
      await updateProcessingPhase(contractId, "failed");
    }

    if (error instanceof LocalExtractionError) {
      if (contractId) {
        await cleanupContractRecord(contractId);
      }
      return jsonError("No se pudo indexar el PDF.", 422, error.message);
    }

    const message =
      error instanceof Error ? error.message : "Error interno del servidor.";
    console.error("[contracts/upload] Indexing error:", message);
    return jsonError("Error en la indexación del contrato.", 500, message);
  }
}
