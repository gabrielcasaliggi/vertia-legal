export type IndexQuality = "ok" | "insufficient_text";

export const MIN_USABLE_INDEX_TEXT_LENGTH = 120;

export function evaluateIndexQuality(extractedText: string): IndexQuality {
  const normalized = extractedText.replace(/\s+/g, " ").trim();
  if (normalized.length < MIN_USABLE_INDEX_TEXT_LENGTH) {
    return "insufficient_text";
  }
  return "ok";
}

export function indexQualityLabel(quality: IndexQuality): string {
  return quality === "insufficient_text"
    ? "Texto insuficiente — requiere OCR"
    : "Indexado correctamente";
}

export interface TextExtractionOutcome {
  text: string;
  quality: IndexQuality;
  warning: string | null;
}

export async function extractTextWithQuality(
  fileBuffer: Buffer,
): Promise<TextExtractionOutcome> {
  const { extractTextLocally, LocalExtractionError } = await import(
    "@/lib/pdf/extract-local"
  );

  try {
    const text = await extractTextLocally(fileBuffer);
    const quality = evaluateIndexQuality(text);
    return {
      text,
      quality,
      warning:
        quality === "insufficient_text"
          ? "El PDF se guardó, pero el texto extraído es insuficiente para búsqueda e IA. Aplicá OCR y reemplazá el archivo."
          : null,
    };
  } catch (error) {
    if (error instanceof LocalExtractionError) {
      return {
        text: "",
        quality: "insufficient_text",
        warning: error.message,
      };
    }
    throw error;
  }
}
