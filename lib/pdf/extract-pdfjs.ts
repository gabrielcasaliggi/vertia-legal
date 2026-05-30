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

async function installPdfJsNodePolyfills(): Promise<void> {
  const globalScope = globalThis as typeof globalThis & {
    DOMMatrix?: typeof DOMMatrix;
    ImageData?: typeof ImageData;
    Path2D?: typeof Path2D;
  };

  if (typeof globalScope.DOMMatrix !== "undefined") {
    return;
  }

  try {
    const canvas = await import("@napi-rs/canvas");
    globalScope.DOMMatrix = canvas.DOMMatrix as unknown as typeof DOMMatrix;
    globalScope.ImageData = canvas.ImageData as unknown as typeof ImageData;
    globalScope.Path2D = canvas.Path2D as unknown as typeof Path2D;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron inicializar polyfills de PDF.";
    throw new PdfJsExtractionError(message);
  }
}

async function resolvePdfWorkerPath(): Promise<string | null> {
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(`${process.cwd()}/package.json`);
    return require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  } catch {
    return null;
  }
}

export async function extractNativeTextWithPdfJs(fileBuffer: Buffer): Promise<string> {
  try {
    await installPdfJsNodePolyfills();
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const workerSrc = await resolvePdfWorkerPath();
    if (workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    }

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
