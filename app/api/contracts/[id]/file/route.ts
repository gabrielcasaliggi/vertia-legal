import { NextRequest, NextResponse } from "next/server";
import {
  buildContentDisposition,
  downloadContractPdf,
  getContractFileRecord,
} from "@/lib/contracts/contract-file";
import type { ApiErrorResponse } from "@/lib/supabase/types";

const CONTRACTS_BUCKET = "contracts";
const SIGNED_URL_TTL_SECONDS = 3600;

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

export async function HEAD(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  const record = await getContractFileRecord(id);

  if (!record) {
    return new NextResponse(null, { status: 404 });
  }

  const downloaded = await downloadContractPdf(record.storage_path);
  if (!downloaded) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(downloaded.size),
      "X-Contract-Hash": record.file_hash,
    },
  });
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<unknown>> {
  const { id } = await context.params;
  const record = await getContractFileRecord(id);

  if (!record) {
    return jsonError("Contrato no encontrado.", 404);
  }

  const metaOnly = request.nextUrl.searchParams.get("meta") === "1";

  if (metaOnly) {
    const downloaded = await downloadContractPdf(record.storage_path);
    return NextResponse.json({
      available: Boolean(downloaded),
      file_name: record.file_name,
      file_hash: record.file_hash,
      storage_path: record.storage_path,
      size_bytes: downloaded?.size ?? null,
      bucket: CONTRACTS_BUCKET,
      reason: downloaded
        ? null
        : "El PDF no está disponible en el almacenamiento. Los expedientes de demo pueden no tener archivo físico.",
    });
  }

  const useSignedUrl = request.nextUrl.searchParams.get("signed") === "1";

  if (useSignedUrl) {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createServerSupabaseClient();
    const { data: signed, error: signError } = await supabase.storage
      .from(CONTRACTS_BUCKET)
      .createSignedUrl(record.storage_path, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed?.signedUrl) {
      return jsonError(
        "No se pudo generar URL del PDF.",
        500,
        signError?.message,
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  }

  const downloaded = await downloadContractPdf(record.storage_path);

  if (!downloaded) {
    return jsonError(
      "El archivo PDF no está en el almacenamiento.",
      404,
      "Reindexá el documento subiendo el PDF nuevamente, o verificá que el expediente no sea solo demo sin archivo.",
    );
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const disposition = buildContentDisposition(
    record.file_name,
    download ? "attachment" : "inline",
  );

  return new NextResponse(new Uint8Array(downloaded.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Content-Length": String(downloaded.size),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "X-Contract-Hash": record.file_hash,
    },
  });
}
