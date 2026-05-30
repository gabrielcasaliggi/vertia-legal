const MIN_INDEXED_TEXT_LENGTH = 30;

function isServerOcrEnabled(): boolean {
  return process.env.ALLOW_SERVER_OCR === "true";
}

function isLikelyVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

export class LocalExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalExtractionError";
  }
}

export async function extractTextLocally(fileBuffer: Buffer): Promise<string> {
  const textModule = await import("@/lib/pdf/extract-text");

  try {
    const outcome = await textModule.classifyAndExtractPdf(fileBuffer);

    if (outcome.mode === "native_text" && outcome.text) {
      return outcome.text;
    }

    if (isLikelyVercelRuntime() && !isServerOcrEnabled()) {
      throw new LocalExtractionError(
        "PDF escaneado o sin texto seleccionable. En producción (Vercel) usá un PDF digital con texto copiable, o habilitá ALLOW_SERVER_OCR=true solo si el plan lo soporta.",
      );
    }

    const ocrModule = await import("@/lib/pdf/ocr-tesseract");
    const ocrText = await ocrModule.ocrPdfWithTesseract(fileBuffer);

    if (ocrText.length < MIN_INDEXED_TEXT_LENGTH) {
      throw new LocalExtractionError(
        "No se pudo indexar texto suficiente del PDF (capa nativa ni OCR local).",
      );
    }

    return ocrText;
  } catch (error) {
    if (error instanceof textModule.PdfExtractionError) {
      throw new LocalExtractionError(error.message);
    }

    const ocrModule = await import("@/lib/pdf/ocr-tesseract");
    if (error instanceof ocrModule.TesseractOcrError) {
      throw new LocalExtractionError(error.message);
    }

    if (error instanceof LocalExtractionError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Error desconocido al extraer texto.";
    throw new LocalExtractionError(message);
  }
}
