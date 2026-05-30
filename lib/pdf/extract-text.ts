import { isUsableNativeText } from "@/lib/pdf/text-quality";
import {
  extractNativeTextWithPdfJs,
  isUsablePdfJsText,
  PdfJsExtractionError,
} from "@/lib/pdf/extract-pdfjs";

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

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

async function classifyWithPdfParse(fileBuffer: Buffer): Promise<PdfExtractionOutcome> {
  const { PDFParse } = await import("pdf-parse");
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

async function classifyWithPdfJs(fileBuffer: Buffer): Promise<PdfExtractionOutcome> {
  const normalizedText = await extractNativeTextWithPdfJs(fileBuffer);

  if (isUsablePdfJsText(normalizedText)) {
    return {
      mode: "native_text",
      text: normalizedText,
    };
  }

  return { mode: "scanned" };
}

export async function classifyAndExtractPdf(
  fileBuffer: Buffer,
): Promise<PdfExtractionOutcome> {
  if (isVercelRuntime()) {
    try {
      return await classifyWithPdfJs(fileBuffer);
    } catch (error) {
      const message =
        error instanceof PdfJsExtractionError || error instanceof Error
          ? error.message
          : "No se pudo leer el PDF en el servidor.";
      throw new PdfExtractionError(message);
    }
  }

  try {
    return await classifyWithPdfParse(fileBuffer);
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      throw error;
    }

    try {
      return await classifyWithPdfJs(fileBuffer);
    } catch {
      const message =
        error instanceof Error ? error.message : "Error desconocido al parsear PDF.";
      throw new PdfExtractionError(message);
    }
  }
}
