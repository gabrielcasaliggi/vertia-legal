import {
  computeLifecycleStatus,
  type LifecycleStatus,
} from "@/lib/contracts/lifecycle";

const DATE_PATTERNS = [
  /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g,
  /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})\b/gi,
];

const MESES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const START_KEYWORDS = [
  "fecha de inicio",
  "inicio de vigencia",
  "entrada en vigencia",
  "a partir del",
  "desde el",
  "vigente desde",
  "inicia el",
];

const END_KEYWORDS = [
  "fecha de fin",
  "fecha de vencimiento",
  "vencimiento",
  "hasta el",
  "hasta la fecha",
  "finaliza el",
  "termina el",
  "plazo hasta",
  "vigencia hasta",
  "caducidad",
];

export interface ExtractedContractMetadata {
  starts_at: string | null;
  expires_at: string | null;
  lifecycle_status: LifecycleStatus;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function parseDateMatch(match: RegExpExecArray): Date | null {
  if (match.length >= 4 && match[3] && /^\d{4}$/.test(match[3])) {
    const monthName = normalizeText(match[2] ?? "");
    const month = MESES[monthName];
    if (month === undefined) {
      return null;
    }
    const day = Number.parseInt(match[1] ?? "", 10);
    const year = Number.parseInt(match[3], 10);
    return new Date(Date.UTC(year, month, day));
  }

  const day = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10) - 1;
  let year = Number.parseInt(match[3] ?? "", 10);
  if (year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }

  return new Date(Date.UTC(year, month, day));
}

function extractAllDates(text: string): Date[] {
  const dates: Date[] = [];

  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match) {
      const parsed = parseDateMatch(match);
      if (parsed) {
        dates.push(parsed);
      }
      match = pattern.exec(text);
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

function findDateNearKeywords(text: string, keywords: string[]): Date | null {
  const normalized = normalizeText(text);
  const windowSize = 120;

  for (const keyword of keywords) {
    const index = normalized.indexOf(normalizeText(keyword));
    if (index === -1) {
      continue;
    }

    const slice = text.slice(index, index + windowSize);
    const dates = extractAllDates(slice);
    if (dates.length > 0) {
      return dates[0] ?? null;
    }
  }

  return null;
}

function toIsoDate(date: Date): string {
  return date.toISOString();
}

export function extractContractMetadataFromText(
  text: string,
  reference = new Date(),
): ExtractedContractMetadata {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      starts_at: null,
      expires_at: null,
      lifecycle_status: "unknown",
    };
  }

  const startNearKeyword = findDateNearKeywords(trimmed, START_KEYWORDS);
  const endNearKeyword = findDateNearKeywords(trimmed, END_KEYWORDS);
  const allDates = extractAllDates(trimmed);

  const startsAt = startNearKeyword ?? allDates[0] ?? null;
  let expiresAt = endNearKeyword ?? null;

  if (!expiresAt && allDates.length >= 2) {
    expiresAt = allDates[allDates.length - 1] ?? null;
  } else if (!expiresAt && allDates.length === 1 && !startsAt) {
    expiresAt = allDates[0] ?? null;
  }

  if (
    startsAt &&
    expiresAt &&
    expiresAt.getTime() <= startsAt.getTime() &&
    allDates.length >= 2
  ) {
    expiresAt = allDates[allDates.length - 1] ?? expiresAt;
  }

  const starts_at = startsAt ? toIsoDate(startsAt) : null;
  const expires_at = expiresAt ? toIsoDate(expiresAt) : null;

  return {
    starts_at,
    expires_at,
    lifecycle_status: computeLifecycleStatus(starts_at, expires_at, reference),
  };
}
