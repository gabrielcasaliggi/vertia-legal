import { createGroqClient, GROQ_MODEL } from "@/lib/groq/client";
import { GroqRateLimitError, isGroqRateLimitError } from "@/lib/groq/errors";
import type { ContractSearchMatch } from "@/lib/contracts/search-intelligence";

export type AssistedQueryMode = "document_query" | "legal_doubt" | "risk_review";

export interface EvidenceCitation {
  texto: string;
  seccion: string | null;
}

export interface AssistedQueryResult {
  modo: AssistedQueryMode;
  respuesta_breve: string;
  fundamento: string;
  evidencia: EvidenceCitation[];
  riesgos_o_advertencias: string[];
  que_revisar: string[];
  accion_sugerida: string;
  disclaimer: string;
  contexto_insuficiente: boolean;
}

export interface AssistedQueryInput {
  message: string;
  mode?: AssistedQueryMode;
  historial?: Array<{ role: "user" | "assistant"; content: string }>;
  contract_id?: string;
  contract_name?: string;
  matches?: ContractSearchMatch[];
}

export interface AssistedQueryResponse {
  structured: AssistedQueryResult;
  /** Texto formateado para historial de chat (compatibilidad UI). */
  respuesta: string;
  contract_id: string | null;
  contexto_usado: boolean;
}

const DISCLAIMER =
  "Revisión asistida con IA. No reemplaza el criterio profesional del estudio.";

const BASE_RULES = `
REGLAS GENERALES:
1. Español rioplatense jurídico, tono senior y claro.
2. Usá SOLO el contexto contractual provisto. Si falta información, indicá contexto_insuficiente: true y qué falta.
3. Citá extractos literales entre comillas en evidencia (máximo 4 citas, texto fiel al contexto).
4. Diferenciá hechos de interpretaciones. Marcá inferencias como "interpretación".
5. No inventes plazos, montos, partes ni cláusulas ausentes.
6. No afirmes validez legal definitiva. Usá lenguaje como "con el texto disponible", "parece razonable", "requiere revisión profesional".
7. accion_sugerida debe ser concreta (ej. crear tarea, revisar cláusula X, ejecutar revisión IA completa).
8. PROHIBIDO: markdown, texto fuera del JSON, volcar el contrato entero.
`;

const MODE_HINTS: Record<AssistedQueryMode, string> = {
  document_query:
    "Modo: consulta sobre el documento. Respondé con foco en hechos contractuales y extractos citados.",
  legal_doubt:
    "Modo: validar una duda legal o contractual. Evaluá razonabilidad, riesgos y qué revisar antes de decidir. Sé prudente.",
  risk_review:
    "Modo: revisión de riesgos. Priorizá cláusulas sensibles, vencimientos, penalidades, rescisión y desequilibrios.",
};

const JSON_SCHEMA = `{
  "modo": "document_query" | "legal_doubt" | "risk_review",
  "respuesta_breve": "string",
  "fundamento": "string",
  "evidencia": [{ "texto": "string", "seccion": "string | null }],
  "riesgos_o_advertencias": ["string"],
  "que_revisar": ["string"],
  "accion_sugerida": "string",
  "disclaimer": "string",
  "contexto_insuficiente": false
}`;

export function inferQueryMode(message: string): AssistedQueryMode {
  const lower = message.toLowerCase();
  if (
    /\b(validar|validación|duda|razonable|válido|ilegal|procedente|conveniente|riesgo legal)\b/.test(
      lower,
    )
  ) {
    return "legal_doubt";
  }
  if (/\b(riesgo|riesgos|penalidad|rescisi[oó]n|vencimiento|obligaci[oó]n|cláusula sensible)\b/.test(lower)) {
    return "risk_review";
  }
  return "document_query";
}

function formatMatchesContext(matches: ContractSearchMatch[]): string {
  if (matches.length === 0) {
    return "";
  }
  const lines = matches.slice(0, 4).map(
    (match, index) =>
      `[${index + 1}] ${match.archivo} (riesgo estimado: ${match.riesgo})
Fragmento búsqueda:
${trimContext(match.snippet, 500)}`,
  );
  return `\n\nFRAGMENTOS DE BÚSQUEDA:\n${lines.join("\n\n")}`;
}

function formatContractContext(
  contractName: string | undefined,
  extractedFragment: string | undefined,
): string {
  if (!extractedFragment) {
    return "";
  }
  return `\n\nDOCUMENTO (${contractName ?? "seleccionado"}):\n${extractedFragment}`;
}

function trimContext(text: string, maxChars = 2400): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars - 80)}\n\n[... contexto truncado ...]`;
}

function trimChatMessage(content: string, maxChars: number): string {
  const normalized = content.trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars - 50)} [...]`;
}

function parseAssistedResult(raw: unknown, fallbackMode: AssistedQueryMode): AssistedQueryResult {
  if (typeof raw !== "object" || raw === null) {
    return emptyResult(fallbackMode, true);
  }
  const record = raw as Record<string, unknown>;
  const modo = record.modo;
  const mode: AssistedQueryMode =
    modo === "document_query" || modo === "legal_doubt" || modo === "risk_review"
      ? modo
      : fallbackMode;

  const evidencia: EvidenceCitation[] = Array.isArray(record.evidencia)
    ? record.evidencia
        .map((item) => {
          if (typeof item !== "object" || item === null) {
            return null;
          }
          const row = item as Record<string, unknown>;
          const texto = typeof row.texto === "string" ? row.texto.trim() : "";
          if (!texto) {
            return null;
          }
          return {
            texto,
            seccion:
              typeof row.seccion === "string" && row.seccion.trim()
                ? row.seccion.trim()
                : null,
          };
        })
        .filter((item): item is EvidenceCitation => item !== null)
        .slice(0, 4)
    : [];

  const stringList = (key: string): string[] =>
    Array.isArray(record[key])
      ? (record[key] as unknown[])
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim())
          .slice(0, 6)
      : [];

  return {
    modo: mode,
    respuesta_breve:
      typeof record.respuesta_breve === "string" ? record.respuesta_breve.trim() : "",
    fundamento: typeof record.fundamento === "string" ? record.fundamento.trim() : "",
    evidencia,
    riesgos_o_advertencias: stringList("riesgos_o_advertencias"),
    que_revisar: stringList("que_revisar"),
    accion_sugerida:
      typeof record.accion_sugerida === "string"
        ? record.accion_sugerida.trim()
        : "Revisar con el equipo legal.",
    disclaimer:
      typeof record.disclaimer === "string" && record.disclaimer.trim()
        ? record.disclaimer.trim()
        : DISCLAIMER,
    contexto_insuficiente: record.contexto_insuficiente === true,
  };
}

function emptyResult(mode: AssistedQueryMode, insufficient: boolean): AssistedQueryResult {
  return {
    modo: mode,
    respuesta_breve: insufficient
      ? "No hay suficiente texto indexado en el contexto para responder con evidencia."
      : "No se pudo procesar la consulta.",
    fundamento: "",
    evidencia: [],
    riesgos_o_advertencias: insufficient ? ["Contexto documental limitado o ausente."] : [],
    que_revisar: insufficient
      ? ["Cargar o reindexar el PDF", "Completar metadatos del expediente"]
      : [],
    accion_sugerida: "Reformular la consulta o ejecutar revisión IA del documento.",
    disclaimer: DISCLAIMER,
    contexto_insuficiente: insufficient,
  };
}

export function formatAssistedResultForChat(result: AssistedQueryResult): string {
  const parts: string[] = [];

  if (result.respuesta_breve) {
    parts.push(result.respuesta_breve);
  }

  if (result.fundamento) {
    parts.push(`\nFundamento:\n${result.fundamento}`);
  }

  if (result.evidencia.length > 0) {
    parts.push(
      "\nEvidencia en el documento:",
      ...result.evidencia.map(
        (item, index) =>
          `${index + 1}. "${item.texto}"${item.seccion ? ` (${item.seccion})` : ""}`,
      ),
    );
  }

  if (result.riesgos_o_advertencias.length > 0) {
    parts.push("\nRiesgos o advertencias:", ...result.riesgos_o_advertencias.map((line) => `• ${line}`));
  }

  if (result.que_revisar.length > 0) {
    parts.push("\nQué revisar:", ...result.que_revisar.map((line) => `• ${line}`));
  }

  if (result.accion_sugerida) {
    parts.push(`\nAcción sugerida: ${result.accion_sugerida}`);
  }

  parts.push(`\n— ${result.disclaimer}`);

  return parts.join("\n").trim();
}

export async function runAssistedQuery(
  input: AssistedQueryInput,
  extractedText?: string | null,
): Promise<AssistedQueryResponse> {
  const message = input.message.trim();
  if (!message) {
    throw new Error("El mensaje no puede estar vacío.");
  }

  const mode = input.mode ?? inferQueryMode(message);
  const hasContext = Boolean(
    extractedText && extractedText.length > 50,
  ) || (input.matches?.length ?? 0) > 0;

  const fragment =
    extractedText && extractedText.length > 0
      ? trimContext(extractedText.slice(0, 2800))
      : undefined;

  const systemContent = trimContext(
    `Eres un asistente contractual senior de Vertia Legal (derecho contractual argentino, CCCN).
${BASE_RULES}
${MODE_HINTS[mode]}
Respondé EXCLUSIVAMENTE con JSON válido con esta forma:
${JSON_SCHEMA}
El campo disclaimer debe ser: "${DISCLAIMER}"
${formatContractContext(input.contract_name, fragment)}
${formatMatchesContext(input.matches ?? [])}`,
    4500,
  );

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemContent },
  ];

  for (const item of (input.historial ?? []).slice(-4)) {
    messages.push({
      role: item.role,
      content: trimChatMessage(item.content, 700),
    });
  }

  messages.push({ role: "user", content: trimChatMessage(message, 1200) });

  const groq = createGroqClient();

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: mode === "legal_doubt" ? 0.2 : 0.25,
      messages,
      response_format: { type: "json_object" },
      max_tokens: 900,
    });

    const rawContent = completion.choices[0]?.message?.content?.trim() ?? "";
    let parsed: AssistedQueryResult;
    try {
      const raw = JSON.parse(rawContent) as unknown;
      parsed = parseAssistedResult(raw, mode);
    } catch {
      parsed = {
        ...emptyResult(mode, !hasContext),
        respuesta_breve: rawContent || "No se pudo estructurar la respuesta.",
        fundamento: "Respuesta en formato libre.",
        accion_sugerida: "Reintentar la consulta.",
      };
    }

    if (!hasContext && parsed.evidencia.length === 0) {
      parsed.contexto_insuficiente = true;
    }

    return {
      structured: parsed,
      respuesta: formatAssistedResultForChat(parsed),
      contract_id: input.contract_id ?? null,
      contexto_usado: hasContext,
    };
  } catch (error) {
    if (isGroqRateLimitError(error)) {
      throw new GroqRateLimitError(
        "Groq rechazó la solicitud por límite de tokens o cuota. Reintentá con una pregunta más puntual.",
      );
    }
    throw error;
  }
}
