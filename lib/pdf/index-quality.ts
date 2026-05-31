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
