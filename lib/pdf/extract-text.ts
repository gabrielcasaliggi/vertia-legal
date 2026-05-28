import { PDFParse } from "pdf-parse";
import { isUsableNativeText } from "@/lib/pdf/text-quality";

const MIN_NATIVE_TEXT_LENGTH = 50;

export type PdfContentMode = "native_text" | "scanned";

export interface PdfExtractionOutcome {
  mode: PdfContentMode;
  text?: string;
}

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

export async function classifyAndExtractPdf(
  fileBuffer: Buffer,
): Promise<PdfExtractionOutcome> {
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const result = await parser.getText();
    const normalizedText = result.text.replace(/\s+/g, " ").trim();

    if (
      normalizedText.length >= MIN_NATIVE_TEXT_LENGTH &&
      isUsableNativeText(normalizedText)
    ) {
      return {
        mode: "native_text",
        text: normalizedText,
      };
    }

    return { mode: "scanned" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido al parsear PDF.";

    if (message.toLowerCase().includes("password")) {
      throw new PdfExtractionError("El PDF está protegido con contraseña.");
    }

    return { mode: "scanned" };
  } finally {
    await parser.destroy();
  }
}
