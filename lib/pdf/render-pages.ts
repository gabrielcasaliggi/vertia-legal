import { pdf } from "pdf-to-img";

const DEFAULT_MAX_PAGES = 6;
const RENDER_SCALE = 2.2;

export class PdfRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfRenderError";
  }
}

export async function renderPdfPagesToPng(
  fileBuffer: Buffer,
  maxPages: number = DEFAULT_MAX_PAGES,
): Promise<Buffer[]> {
  const pages: Buffer[] = [];

  try {
    const document = await pdf(fileBuffer, { scale: RENDER_SCALE });
    let pageIndex = 0;

    for await (const image of document) {
      if (pageIndex >= maxPages) {
        break;
      }

      pages.push(Buffer.from(image));
      pageIndex += 1;
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido al rasterizar el PDF.";
    throw new PdfRenderError(message);
  }

  if (pages.length === 0) {
    throw new PdfRenderError("No se pudieron renderizar páginas del PDF.");
  }

  return pages;
}
