import { classifyAndExtractPdf, PdfExtractionError } from "@/lib/pdf/extract-text";
import { ocrPdfWithTesseract, TesseractOcrError } from "@/lib/pdf/ocr-tesseract";

const MIN_INDEXED_TEXT_LENGTH = 30;

export class LocalExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalExtractionError";
  }
}

export async function extractTextLocally(fileBuffer: Buffer): Promise<string> {
  try {
    const outcome = await classifyAndExtractPdf(fileBuffer);

    if (outcome.mode === "native_text" && outcome.text) {
      return outcome.text;
    }

    const ocrText = await ocrPdfWithTesseract(fileBuffer);

    if (ocrText.length < MIN_INDEXED_TEXT_LENGTH) {
      throw new LocalExtractionError(
        "No se pudo indexar texto suficiente del PDF (capa nativa ni OCR local).",
      );
    }

    return ocrText;
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      throw new LocalExtractionError(error.message);
    }

    if (error instanceof TesseractOcrError) {
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
