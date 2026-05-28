import { computeDaysUntilExpiry } from "@/lib/contracts/lifecycle";
import type { LifecycleStatus } from "@/lib/contracts/lifecycle";

export type RiesgoNivel = "BAJO" | "MEDIO" | "ALTO";

export interface ContractSearchMatch {
  id: string;
  contract_id: string;
  archivo: string;
  snippet: string;
  riesgo: RiesgoNivel;
  dias_criticos: number | null;
  client_name: string;
  folder_name: string;
  contract_type: string | null;
  party_a: string | null;
  party_b: string | null;
  starts_at: string | null;
  expires_at: string | null;
  lifecycle_status: LifecycleStatus;
}

const RIESGO_ALTO = [
  "penalidad",
  "penalidades",
  "multa",
  "multas",
  "rescisión",
  "rescision",
  "resolución",
  "resolucion",
  "incumplimiento",
  "terminación",
  "terminacion",
  "indemnización",
  "indemnizacion",
  "responsabilidad ilimitada",
  "exclusividad",
  "confidencialidad estricta",
  "vencimiento",
  "caducidad",
  "nulidad",
  "arbitraje obligatorio",
];

const RIESGO_MEDIO = [
  "obligacion",
  "obligaciones",
  "plazo",
  "plazos",
  "garantia",
  "garantía",
  "confidencialidad",
  "modificacion",
  "modificación",
  "renovacion",
  "renovación",
  "prorroga",
  "prórroga",
  "notificacion",
  "notificación",
  "cumplimiento",
  "sla",
];

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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+|\r\n\s*\r\n+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part.length >= 20);
}

function buildSnippetWindow(paragraph: string, keyword: string, radius = 220): string {
  const normalizedParagraph = normalizeText(paragraph);
  const normalizedKeyword = normalizeText(keyword);
  const index = normalizedParagraph.indexOf(normalizedKeyword);

  if (index === -1) {
    return paragraph.slice(0, radius * 2);
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(paragraph.length, index + normalizedKeyword.length + radius);
  let snippet = paragraph.slice(start, end).trim();

  if (start > 0) {
    snippet = `…${snippet}`;
  }
  if (end < paragraph.length) {
    snippet = `${snippet}…`;
  }

  const highlightRegex = new RegExp(`(${escapeRegExp(keyword)})`, "gi");
  return snippet.replace(highlightRegex, "【$1】");
}

export function extractMatchingSnippets(
  text: string,
  keyword: string,
  maxMatches = 3,
): string[] {
  if (!text.trim() || !keyword.trim()) {
    return [];
  }

  const normalizedKeyword = normalizeText(keyword);
  const snippets: string[] = [];

  for (const paragraph of splitParagraphs(text)) {
    if (!normalizeText(paragraph).includes(normalizedKeyword)) {
      continue;
    }
    snippets.push(buildSnippetWindow(paragraph, keyword));
    if (snippets.length >= maxMatches) {
      break;
    }
  }

  if (snippets.length === 0 && normalizeText(text).includes(normalizedKeyword)) {
    snippets.push(buildSnippetWindow(text, keyword, 280));
  }

  return snippets;
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

function extractFutureDates(text: string, reference = new Date()): Date[] {
  const dates: Date[] = [];

  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match) {
      const parsed = parseDateMatch(match);
      if (parsed && parsed.getTime() >= reference.getTime()) {
        dates.push(parsed);
      }
      match = pattern.exec(text);
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

function daysUntil(date: Date, reference = new Date()): number {
  const ref = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  );
  const target = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.max(0, Math.round((target - ref) / 86_400_000));
}

export function simulateRiesgo(snippet: string, keyword: string): RiesgoNivel {
  const corpus = normalizeText(`${snippet} ${keyword}`);
  const altoHits = RIESGO_ALTO.filter((term) => corpus.includes(normalizeText(term))).length;
  const medioHits = RIESGO_MEDIO.filter((term) => corpus.includes(normalizeText(term))).length;

  if (altoHits >= 2 || (altoHits >= 1 && medioHits >= 1)) {
    return "ALTO";
  }
  if (altoHits >= 1 || medioHits >= 2) {
    return "MEDIO";
  }
  if (medioHits >= 1) {
    return "MEDIO";
  }
  return "BAJO";
}

export function simulateDiasCriticos(
  snippet: string,
  riesgo: RiesgoNivel,
  expiresAt: string | null,
): number | null {
  const now = new Date();
  const candidates: number[] = [];

  for (const date of extractFutureDates(snippet, now)) {
    candidates.push(daysUntil(date, now));
  }

  if (expiresAt) {
    const expires = new Date(expiresAt);
    if (!Number.isNaN(expires.getTime()) && expires.getTime() >= now.getTime()) {
      candidates.push(daysUntil(expires, now));
    }
  }

  if (candidates.length > 0) {
    return Math.min(...candidates);
  }

  if (riesgo === "ALTO") {
    return 15;
  }
  if (riesgo === "MEDIO") {
    return 45;
  }
  return 90;
}

export function riesgoToScore(riesgo: RiesgoNivel): number {
  if (riesgo === "ALTO") {
    return 82;
  }
  if (riesgo === "MEDIO") {
    return 48;
  }
  return 18;
}

interface BuildMatchesInput {
  id: string;
  file_name: string;
  client_name: string;
  folder_name: string;
  starts_at: string | null;
  expires_at: string | null;
  contract_type: string | null;
  party_a: string | null;
  party_b: string | null;
  lifecycle_status: LifecycleStatus;
  extracted_text: string | null;
}

export function buildSearchMatches(
  contracts: BuildMatchesInput[],
  keyword: string,
): ContractSearchMatch[] {
  const matches: ContractSearchMatch[] = [];

  for (const contract of contracts) {
    if (!contract.extracted_text) {
      continue;
    }

    const snippets = extractMatchingSnippets(contract.extracted_text, keyword, 2);
    for (const snippet of snippets) {
      const riesgo = simulateRiesgo(snippet, keyword);
      const realDays = computeDaysUntilExpiry(contract.expires_at);
      matches.push({
        id: `${contract.id}:${matches.length}`,
        contract_id: contract.id,
        archivo: contract.file_name,
        snippet,
        riesgo,
        dias_criticos:
          realDays ?? simulateDiasCriticos(snippet, riesgo, contract.expires_at),
        client_name: contract.client_name,
        folder_name: contract.folder_name,
        contract_type: contract.contract_type,
        party_a: contract.party_a,
        party_b: contract.party_b,
        starts_at: contract.starts_at,
        expires_at: contract.expires_at,
        lifecycle_status: contract.lifecycle_status,
      });
    }
  }

  return matches.sort((a, b) => riesgoToScore(b.riesgo) - riesgoToScore(a.riesgo));
}
