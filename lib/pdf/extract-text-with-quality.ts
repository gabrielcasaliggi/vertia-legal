import {
  evaluateIndexQuality,
  type IndexQuality,
  type TextExtractionOutcome,
} from "@/lib/pdf/index-quality";

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
        quality: "insufficient_text" satisfies IndexQuality,
        warning: error.message,
      };
    }
    throw error;
  }
}
