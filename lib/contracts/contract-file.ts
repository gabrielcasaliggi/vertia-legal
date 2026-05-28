import { createServerSupabaseClient } from "@/lib/supabase/server";

const CONTRACTS_BUCKET = "contracts";

export interface ContractFileRecord {
  id: string;
  file_name: string;
  storage_path: string;
  file_hash: string;
}

export async function getContractFileRecord(
  contractId: string,
): Promise<ContractFileRecord | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("legal_contracts")
    .select("id, file_name, storage_path, file_hash")
    .eq("id", contractId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function downloadContractPdf(
  storagePath: string,
): Promise<{ buffer: Buffer; size: number } | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.storage
    .from(CONTRACTS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    return null;
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    return null;
  }

  return { buffer, size: buffer.length };
}

export function sanitizePdfFileName(fileName: string): string {
  const base = fileName.trim() || "documento.pdf";
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

export function buildContentDisposition(
  fileName: string,
  mode: "inline" | "attachment",
): string {
  const safeName = sanitizePdfFileName(fileName).replace(/["\r\n]/g, "_");
  const encoded = encodeURIComponent(safeName);
  return `${mode}; filename="${safeName}"; filename*=UTF-8''${encoded}`;
}
