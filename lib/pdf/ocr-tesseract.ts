import { createWorker } from "tesseract.js";
import { renderPdfPagesToPng } from "@/lib/pdf/render-pages";

const MAX_OCR_PAGES = 5;

export class TesseractOcrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TesseractOcrError";
  }
}

export async function ocrPdfWithTesseract(fileBuffer: Buffer): Promise<string> {
  const pages = await renderPdfPagesToPng(fileBuffer, MAX_OCR_PAGES);
  const worker = await createWorker("spa");

  try {
    const chunks: string[] = [];

    for (const page of pages) {
      const result = await worker.recognize(page);
      const normalized = result.data.text.replace(/\s+/g, " ").trim();
      if (normalized.length > 0) {
        chunks.push(normalized);
      }
    }

    return chunks.join("\n\n").trim();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falló el OCR local con Tesseract.";
    throw new TesseractOcrError(message);
  } finally {
    await worker.terminate();
  }
}
