import { isUsableNativeText } from "@/lib/pdf/text-quality";

const MIN_NATIVE_TEXT_LENGTH = 50;

export class PdfJsExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfJsExtractionError";
  }
}

interface TextItemLike {
  str?: string;
}

export async function extractNativeTextWithPdfJs(fileBuffer: Buffer): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(fileBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    const document = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => {
          const textItem = item as TextItemLike;
          return typeof textItem.str === "string" ? textItem.str : "";
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText.length > 0) {
        pageTexts.push(pageText);
      }
    }

    await document.destroy();

    return pageTexts.join("\n\n").replace(/\s+/g, " ").trim();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido al leer PDF con pdfjs.";
    throw new PdfJsExtractionError(message);
  }
}

export function isUsablePdfJsText(text: string): boolean {
  return text.length >= MIN_NATIVE_TEXT_LENGTH && isUsableNativeText(text);
}
