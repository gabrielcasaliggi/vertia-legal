import { NextResponse } from "next/server";
import { extractNativeTextWithPdfJs } from "@/lib/pdf/extract-pdfjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** PDF mínimo válido (1 página en blanco) para smoke test de extracción. */
const MINIMAL_PDF_BASE64 =
  "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFI+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjE5NAolJUVPRgo=";

export async function GET(): Promise<NextResponse> {
  try {
    const buffer = Buffer.from(MINIMAL_PDF_BASE64, "base64");
    const text = await extractNativeTextWithPdfJs(buffer);
    return NextResponse.json({
      ok: true,
      extractedLength: text.length,
      engine: "pdfjs-dist",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error en extracción PDF";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 503 },
    );
  }
}
