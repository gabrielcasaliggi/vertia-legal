const MIN_WORD_COUNT = 40;
const MIN_ALPHA_RATIO = 0.45;
const MIN_UNIQUE_WORD_RATIO = 0.25;

export function isUsableNativeText(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length < 120) {
    return false;
  }

  const words = normalized
    .split(/\s+/)
    .map((word) => word.replace(/[^\wáéíóúñÁÉÍÓÚÑ]/gi, ""))
    .filter((word) => word.length > 2);

  if (words.length < MIN_WORD_COUNT) {
    return false;
  }

  const alphaChars = normalized.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/g)?.length ?? 0;
  if (alphaChars / normalized.length < MIN_ALPHA_RATIO) {
    return false;
  }

  const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
  if (uniqueWords.size / words.length < MIN_UNIQUE_WORD_RATIO) {
    return false;
  }

  return true;
}
