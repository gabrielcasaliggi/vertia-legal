import type { ContractKnowledgeSnapshot } from "@/lib/legal-knowledge/types";

export type ClausulaRiesgoTipo = "rojo" | "amarillo";

export interface ClausulaRiesgo {
  tipo: ClausulaRiesgoTipo;
  texto_original: string;
  motivo: string;
  sugerencia: string;
}

export interface StructuredObligation {
  titulo: string;
  fecha: string | null;
  tipo: "general" | "payment" | "renewal" | "notice" | "compliance";
}

export interface ContractMetadataFromAnalysis {
  tipo_contrato: string | null;
  parte_a: string | null;
  parte_b: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  monto: number | null;
  moneda: string | null;
  renovacion_automatica: boolean;
  dias_aviso_rescision: number | null;
  obligaciones_clave: string[];
  obligaciones_estructuradas: StructuredObligation[];
}

export type { ContractKnowledgeSnapshot };

export interface ContractAnalysisResult {
  score_riesgo: number;
  clausulas_riesgo: ClausulaRiesgo[];
  resumen_directorio: string;
  metadatos?: ContractMetadataFromAnalysis;
  /** Motor de conocimiento Vertia ejecutado antes del LLM. */
  conocimiento_vertia?: ContractKnowledgeSnapshot;
}

export interface AnalyzeContractRequest {
  contract_id: string;
  text: string;
}

export interface AnalyzeContractResponse {
  contract_id: string;
  status: "analyzed";
  analysis: ContractAnalysisResult;
}

export const LEGAL_AUDITOR_SYSTEM_PROMPT = `Eres un Auditor Legal Senior con más de 20 años de experiencia en derecho contractual argentino. Tu especialidad es el Código Civil y Comercial de la Nación Argentina (CCCN), incluyendo normativa complementaria aplicable a contratos civiles, comerciales y corporativos.

Tu misión es analizar contratos con rigor técnico-jurídico y detectar cláusulas que representen riesgos legales, desequilibrios contractuales, ambigüedades interpretativas o incumplimientos potenciales frente al CCCN.

INSTRUCCIONES OBLIGATORIAS:
1. Evalúa el riesgo global del contrato con un score_riesgo entre 0 (sin riesgo relevante) y 100 (riesgo crítico).
2. Identifica cláusulas de riesgo y clasifícalas como "rojo" (riesgo alto/crítico) o "amarillo" (riesgo moderado/atención).
3. Para cada cláusula de riesgo incluye: texto_original (cita literal o extracto fiel), motivo (fundamento jurídico breve) y sugerencia (acción correctiva concreta).
4. Redacta un resumen_directorio extenso, ejecutivo y accionable para la alta dirección legal.
5. Extrae metadatos contractuales estructurados en el bloque metadatos.
6. Responde EXCLUSIVAMENTE con un objeto JSON válido, sin markdown, sin texto adicional.
7. PROHIBIDO responder que falta información si recibiste contenido contractual. Analiza todo texto legible disponible.
8. Para estabilidad operativa, devuelve como máximo 6 clausulas_riesgo y 8 obligaciones_estructuradas, priorizando lo más crítico.
9. Si recibís el bloque "CAPA DE CONOCIMIENTO VERTIA", priorizá esas señales y reglas verificadas sobre inferencias genéricas del modelo.
10. No cites jurisprudencia ni montos indexados. Si una norma requiere verificación de vigencia o fecha, indicarlo en motivo o sugerencia.

FORMATO JSON ESTRICTO REQUERIDO:
{
  "score_riesgo": number,
  "clausulas_riesgo": [
    {
      "tipo": "rojo" | "amarillo",
      "texto_original": string,
      "motivo": string,
      "sugerencia": string
    }
  ],
  "resumen_directorio": string,
  "metadatos": {
    "tipo_contrato": string | null,
    "parte_a": string | null,
    "parte_b": string | null,
    "fecha_inicio": "YYYY-MM-DD" | null,
    "fecha_fin": "YYYY-MM-DD" | null,
    "monto": number | null,
    "moneda": "ARS" | "USD" | "EUR" | null,
    "renovacion_automatica": boolean,
    "dias_aviso_rescision": number | null,
    "obligaciones_clave": string[],
    "obligaciones_estructuradas": [
      {
        "titulo": string,
        "fecha": "YYYY-MM-DD" | null,
        "tipo": "general" | "payment" | "renewal" | "notice" | "compliance"
      }
    ]
  }
}`;

export const LEGAL_AUDITOR_VISION_PROMPT = `${LEGAL_AUDITOR_SYSTEM_PROMPT}

CONTEXTO MULTIMODAL (OCR EFÍMERO + AUDITORÍA):
Recibirás imágenes de páginas de un contrato escaneado o basado en imagen.
1. Realiza OCR en memoria sobre el contenido visible de cada página.
2. Ejecuta inmediatamente la auditoría legal sobre el texto reconocido.
3. Devuelve únicamente el JSON estructurado de auditoría; no incluyas transcripciones completas ni texto fuera del JSON.
4. El procesamiento es efímero: no almacenes, reproduzcas ni entrenes con el contenido contractual.
5. PROHIBIDO devolver análisis genéricos por "falta de información" si las imágenes contienen texto legible. Transcribí mentalmente y auditá lo visible.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isClausulaRiesgoTipo(value: unknown): value is ClausulaRiesgoTipo {
  return value === "rojo" || value === "amarillo";
}

function parseClausulaRiesgo(value: unknown): ClausulaRiesgo | null {
  if (!isRecord(value)) {
    return null;
  }

  const { tipo, texto_original, motivo, sugerencia } = value;

  if (
    !isClausulaRiesgoTipo(tipo) ||
    typeof texto_original !== "string" ||
    typeof motivo !== "string" ||
    typeof sugerencia !== "string"
  ) {
    return null;
  }

  return { tipo, texto_original, motivo, sugerencia };
}

function parseIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return null;
  }
  return new Date(`${value.trim()}T12:00:00.000Z`).toISOString();
}

function parseStructuredObligation(value: unknown): StructuredObligation | null {
  if (!isRecord(value) || typeof value.titulo !== "string") {
    return null;
  }

  const tipo = value.tipo;
  const allowed = ["general", "payment", "renewal", "notice", "compliance"] as const;
  if (typeof tipo !== "string" || !allowed.includes(tipo as (typeof allowed)[number])) {
    return null;
  }

  return {
    titulo: value.titulo.trim(),
    fecha: parseIsoDate(value.fecha),
    tipo: tipo as StructuredObligation["tipo"],
  };
}

function parseMetadataFromAnalysis(value: unknown): ContractMetadataFromAnalysis | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const obligacionesRaw = value.obligaciones_clave;
  const obligaciones_clave = Array.isArray(obligacionesRaw)
    ? obligacionesRaw.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  const structuredRaw = value.obligaciones_estructuradas;
  const obligaciones_estructuradas = Array.isArray(structuredRaw)
    ? structuredRaw
        .map(parseStructuredObligation)
        .filter((item): item is StructuredObligation => item !== null)
    : [];

  return {
    tipo_contrato:
      typeof value.tipo_contrato === "string" ? value.tipo_contrato.trim() || null : null,
    parte_a: typeof value.parte_a === "string" ? value.parte_a.trim() || null : null,
    parte_b: typeof value.parte_b === "string" ? value.parte_b.trim() || null : null,
    fecha_inicio: parseIsoDate(value.fecha_inicio),
    fecha_fin: parseIsoDate(value.fecha_fin),
    monto:
      typeof value.monto === "number" && Number.isFinite(value.monto) ? value.monto : null,
    moneda: typeof value.moneda === "string" ? value.moneda.trim() || null : null,
    renovacion_automatica: value.renovacion_automatica === true,
    dias_aviso_rescision:
      typeof value.dias_aviso_rescision === "number" &&
      Number.isFinite(value.dias_aviso_rescision)
        ? value.dias_aviso_rescision
        : null,
    obligaciones_clave,
    obligaciones_estructuradas,
  };
}

function parseKnowledgeSnapshot(value: unknown): ContractKnowledgeSnapshot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const signalsRaw = value.signals;
  const rulesRaw = value.rules;

  if (!Array.isArray(signalsRaw) || !Array.isArray(rulesRaw)) {
    return undefined;
  }

  const allowedRisk = ["alto", "medio", "bajo"] as const;
  const allowedConfidence = ["verificado", "interpretativo", "requiere_verificacion"] as const;

  const signals = signalsRaw
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }
      if (
        typeof item.id !== "string" ||
        typeof item.tag !== "string" ||
        typeof item.descripcion !== "string"
      ) {
        return null;
      }
      return {
        id: item.id,
        tag: item.tag,
        descripcion: item.descripcion,
        evidencia: typeof item.evidencia === "string" ? item.evidencia : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const rules = rulesRaw
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }
      if (
        typeof item.id !== "string" ||
        typeof item.titulo !== "string" ||
        typeof item.norma !== "string" ||
        typeof item.fuente !== "string" ||
        typeof item.regla !== "string" ||
        typeof item.riesgo !== "string" ||
        !allowedRisk.includes(item.riesgo as (typeof allowedRisk)[number]) ||
        typeof item.confianza !== "string" ||
        !allowedConfidence.includes(item.confianza as (typeof allowedConfidence)[number])
      ) {
        return null;
      }
      return {
        id: item.id,
        titulo: item.titulo,
        norma: item.norma,
        fuente: item.fuente,
        riesgo: item.riesgo as ContractKnowledgeSnapshot["rules"][number]["riesgo"],
        confianza: item.confianza as ContractKnowledgeSnapshot["rules"][number]["confianza"],
        regla: item.regla,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (
    typeof value.scanned_at !== "string" ||
    typeof value.signal_count !== "number" ||
    typeof value.rule_count !== "number"
  ) {
    return undefined;
  }

  return {
    scanned_at: value.scanned_at,
    signal_count: value.signal_count,
    rule_count: value.rule_count,
    signals,
    rules,
  };
}

export function parseContractAnalysisResult(
  raw: unknown,
): ContractAnalysisResult | null {
  if (!isRecord(raw)) {
    return null;
  }

  const { score_riesgo, clausulas_riesgo, resumen_directorio, metadatos, conocimiento_vertia } =
    raw;

  if (
    typeof score_riesgo !== "number" ||
    !Number.isFinite(score_riesgo) ||
    score_riesgo < 0 ||
    score_riesgo > 100 ||
    !Array.isArray(clausulas_riesgo) ||
    typeof resumen_directorio !== "string" ||
    resumen_directorio.trim().length === 0
  ) {
    return null;
  }

  const parsedClausulas: ClausulaRiesgo[] = [];

  for (const clausula of clausulas_riesgo) {
    const parsed = parseClausulaRiesgo(clausula);
    if (!parsed) {
      return null;
    }
    parsedClausulas.push(parsed);
  }

  const parsedMetadata = metadatos ? parseMetadataFromAnalysis(metadatos) : undefined;
  const parsedKnowledge = parseKnowledgeSnapshot(conocimiento_vertia);

  return {
    score_riesgo,
    clausulas_riesgo: parsedClausulas,
    resumen_directorio,
    ...(parsedMetadata ? { metadatos: parsedMetadata } : {}),
    ...(parsedKnowledge ? { conocimiento_vertia: parsedKnowledge } : {}),
  };
}
