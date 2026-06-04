import type { ContractKnowledgeSnapshot } from "@/lib/legal-knowledge/types";

export type ComparisonSide = "base" | "comparado" | "equilibrado";
export type ComparisonRiskLevel = "alto" | "medio" | "bajo";

export interface ContractComparisonDocument {
  id: string;
  file_name: string;
  client_name: string;
  folder_name: string;
  contract_type: string | null;
  party_a: string | null;
  party_b: string | null;
  starts_at: string | null;
  expires_at: string | null;
  status: string;
  knowledge: ContractKnowledgeSnapshot;
}

export interface ContractComparisonCriticalChange {
  categoria: string;
  titulo: string;
  contrato_base: string;
  contrato_comparado: string;
  impacto: string;
  sugerencia: string;
  nivel: ComparisonRiskLevel;
}

export interface ContractComparisonOperationalDifference {
  campo: string;
  contrato_base: string;
  contrato_comparado: string;
  relevancia: string;
}

export interface ContractComparisonRisk {
  documento_mas_riesgoso: ComparisonSide;
  score_base: number;
  score_comparado: number;
  motivo: string;
}

export interface ContractComparisonResult {
  resumen_ejecutivo: string;
  riesgo_comparativo: ContractComparisonRisk;
  cambios_criticos: ContractComparisonCriticalChange[];
  diferencias_operativas: ContractComparisonOperationalDifference[];
  clausulas_agregadas: string[];
  clausulas_eliminadas: string[];
  clausulas_modificadas: string[];
  recomendaciones: string[];
}

export interface ContractComparisonResponse {
  comparison_id: string;
  generated_at: string;
  base: ContractComparisonDocument;
  compared: ContractComparisonDocument;
  result: ContractComparisonResult;
}

export interface DeterministicDifference {
  campo: string;
  contrato_base: string;
  contrato_comparado: string;
  nota?: string;
}

export interface ComparisonContractInput {
  file_name: string;
  client_name: string;
  folder_name: string;
  contract_type: string | null;
  party_a: string | null;
  party_b: string | null;
  starts_at: string | null;
  expires_at: string | null;
  auto_renewal: boolean;
  renewal_notice_days: number | null;
}

export const CONTRACT_COMPARISON_SYSTEM_PROMPT = `Eres el motor de comparación contractual de Vertia Legal para derecho contractual argentino.

OBJETIVO:
Comparar dos contratos ya indexados: CONTRATO BASE (referencia, versión anterior o modelo) y CONTRATO COMPARADO (versión nueva o propuesta).

REGLAS OBLIGATORIAS:
1. No hagas redlining palabra por palabra. Priorizá diferencias con impacto legal, económico u operativo.
2. No inventes normas, jurisprudencia ni valores no presentes. Si una diferencia requiere verificación profesional, indicarlo.
3. Diferenciá cambios críticos de simples diferencias de metadatos.
4. Marcá si el contrato comparado queda más riesgoso, menos riesgoso o equilibrado respecto del base.
5. Responde EXCLUSIVAMENTE con JSON válido, sin markdown ni texto adicional.
6. Devolvé como máximo 8 cambios críticos, 10 diferencias operativas y 8 recomendaciones.
7. Los scores son de 0 a 100: 0 = sin riesgo comparativo, 100 = riesgo máximo. No uses escala 1 a 10.
8. Las diferencias determinísticas de metadatos son indicios del sistema, no certeza jurídica. Si una fecha o dato parece inconsistente con el nombre del documento o el contexto, marcá "requiere verificación" y no lo presentes como conclusión crítica.
9. En diferencias_operativas.relevancia escribí una oración útil. Prohibido responder solo "Alta", "Media" o "Baja".
10. PROHIBIDO tratar fechas indexadas o vigencia como cambio crítico si surgen solo de metadatos automáticos. Solo elevá vigencia/fecha a cambio crítico si el texto contractual permite confirmar una cláusula de plazo, inicio, terminación o prórroga.
11. No califiques una cláusula como "abusiva", "nula" o "ilegal" salvo que el texto y el tipo de relación lo sustenten claramente. Preferí "potencialmente desfavorable", "requiere revisión" o "puede aumentar exposición".
12. Las recomendaciones deben ser concretas y accionables. Evitá fórmulas vagas como "revisar y considerar"; indicá qué negociar, verificar, limitar, documentar o pedir.

FORMATO JSON ESTRICTO:
{
  "resumen_ejecutivo": "síntesis ejecutiva de la comparación",
  "riesgo_comparativo": {
    "documento_mas_riesgoso": "base | comparado | equilibrado",
    "score_base": 0,
    "score_comparado": 0,
    "motivo": "explicación breve"
  },
  "cambios_criticos": [
    {
      "categoria": "rescisión | confidencialidad | penalidades | jurisdicción | pagos | renovación | obligaciones | otro",
      "titulo": "cambio identificado",
      "contrato_base": "cómo estaba en el contrato base",
      "contrato_comparado": "cómo queda en el contrato comparado",
      "impacto": "por qué importa",
      "sugerencia": "acción recomendada",
      "nivel": "alto | medio | bajo"
    }
  ],
  "diferencias_operativas": [
    {
      "campo": "campo comparado",
      "contrato_base": "valor base",
      "contrato_comparado": "valor comparado",
      "relevancia": "por qué revisar o no revisar"
    }
  ],
  "clausulas_agregadas": ["cláusulas o temas presentes en comparado y ausentes en base"],
  "clausulas_eliminadas": ["cláusulas o temas presentes en base y ausentes en comparado"],
  "clausulas_modificadas": ["cláusulas similares con tratamiento diferente"],
  "recomendaciones": ["recomendaciones accionables para revisión profesional"]
}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "No determinado"): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function normalizeRecommendation(value: string): string {
  return value
    .replace(/^revisar y considerar las implicaciones (legales y contractuales )?de /i, "Verificar ")
    .replace(/^revisar y considerar las implicaciones (legales|contractuales) de /i, "Verificar ")
    .replace(/^revisar y considerar /i, "Verificar ")
    .trim();
}

function asScore(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 50;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function asRiskLevel(value: unknown): ComparisonRiskLevel {
  return value === "alto" || value === "medio" || value === "bajo" ? value : "medio";
}

function asComparisonSide(value: unknown): ComparisonSide {
  if (value === "base" || value === "comparado" || value === "equilibrado") {
    return value;
  }
  return "equilibrado";
}

function parseCriticalChange(value: unknown): ContractComparisonCriticalChange | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    categoria: asString(value.categoria, "otro"),
    titulo: asString(value.titulo, "Cambio relevante"),
    contrato_base: asString(value.contrato_base),
    contrato_comparado: asString(value.contrato_comparado),
    impacto: asString(value.impacto),
    sugerencia: asString(value.sugerencia, "Revisión profesional recomendada."),
    nivel: asRiskLevel(value.nivel),
  };
}

function parseOperationalDifference(
  value: unknown,
): ContractComparisonOperationalDifference | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    campo: asString(value.campo, "Campo"),
    contrato_base: asString(value.contrato_base),
    contrato_comparado: asString(value.contrato_comparado),
    relevancia: normalizeOperationalRelevance(value.relevancia),
  };
}

function normalizeOperationalRelevance(value: unknown): string {
  const relevance = asString(value, "Diferencia a revisar.");
  const normalized = relevance.trim().toLowerCase().replace(/\.$/, "");

  if (normalized === "alta" || normalized === "alto") {
    return "Diferencia de alta relevancia operativa; revisar contra el texto contractual antes de decidir.";
  }
  if (normalized === "media" || normalized === "medio") {
    return "Diferencia de relevancia media; conviene validarla porque puede afectar seguimiento o gestión.";
  }
  if (normalized === "baja" || normalized === "bajo") {
    return "Diferencia de baja relevancia jurídica directa; verificar si responde a clasificación interna.";
  }

  return relevance;
}

function isUnverifiedDateChange(change: ContractComparisonCriticalChange): boolean {
  const text = `${change.categoria} ${change.titulo} ${change.impacto}`.toLowerCase();
  const mentionsDate = /vigencia|fecha|plazo|inicio|fin|vencimiento/.test(text);
  const mentionsVerification = /verific|validar|confirmar|texto contractual/.test(text);

  return mentionsDate && !mentionsVerification;
}

function formatComparableValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }
  if (typeof value === "string" && value.length >= 10) {
    const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
      return `${isoDateMatch[3]}/${isoDateMatch[2]}/${isoDateMatch[1]}`;
    }
  }
  if (value === null || value === undefined || value === "") {
    return "No determinado";
  }
  return String(value);
}

export function parseContractComparisonResult(
  raw: unknown,
): ContractComparisonResult | null {
  if (!isRecord(raw) || !isRecord(raw.riesgo_comparativo)) {
    return null;
  }

  const parsedCriticalChanges = Array.isArray(raw.cambios_criticos)
    ? raw.cambios_criticos
        .map(parseCriticalChange)
        .filter((item): item is ContractComparisonCriticalChange => item !== null)
        .slice(0, 8)
    : [];

  const operationalDifferences = Array.isArray(raw.diferencias_operativas)
    ? raw.diferencias_operativas
        .map(parseOperationalDifference)
        .filter((item): item is ContractComparisonOperationalDifference => item !== null)
        .slice(0, 10)
    : [];

  const dateChangesToVerify = parsedCriticalChanges.filter(isUnverifiedDateChange);
  const criticalChanges = parsedCriticalChanges.filter(
    (change) => !isUnverifiedDateChange(change),
  );
  const dateOperationalDifferences: ContractComparisonOperationalDifference[] =
    dateChangesToVerify.map((change) => ({
      campo: change.titulo,
      contrato_base: change.contrato_base,
      contrato_comparado: change.contrato_comparado,
      relevancia:
        "Diferencia de fecha o vigencia detectada automáticamente; requiere verificación contra el texto contractual antes de tratarla como cambio crítico.",
    }));

  return {
    resumen_ejecutivo: asString(raw.resumen_ejecutivo, "Comparación generada."),
    riesgo_comparativo: {
      documento_mas_riesgoso: asComparisonSide(
        raw.riesgo_comparativo.documento_mas_riesgoso,
      ),
      score_base: asScore(raw.riesgo_comparativo.score_base),
      score_comparado: asScore(raw.riesgo_comparativo.score_comparado),
      motivo: asString(raw.riesgo_comparativo.motivo),
    },
    cambios_criticos: criticalChanges,
    diferencias_operativas: [...dateOperationalDifferences, ...operationalDifferences].slice(
      0,
      10,
    ),
    clausulas_agregadas: asStringArray(raw.clausulas_agregadas, 10),
    clausulas_eliminadas: asStringArray(raw.clausulas_eliminadas, 10),
    clausulas_modificadas: asStringArray(raw.clausulas_modificadas, 10),
    recomendaciones: asStringArray(raw.recomendaciones, 8).map(normalizeRecommendation),
  };
}

function parseComparisonDocument(value: unknown): ContractComparisonDocument | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string" || typeof value.file_name !== "string") {
    return null;
  }

  const knowledgeRaw = value.knowledge;
  const knowledge =
    isRecord(knowledgeRaw) &&
    typeof knowledgeRaw.scanned_at === "string" &&
    typeof knowledgeRaw.signal_count === "number" &&
    typeof knowledgeRaw.rule_count === "number" &&
    Array.isArray(knowledgeRaw.signals) &&
    Array.isArray(knowledgeRaw.rules)
      ? {
          scanned_at: knowledgeRaw.scanned_at,
          signal_count: knowledgeRaw.signal_count,
          rule_count: knowledgeRaw.rule_count,
          signals: knowledgeRaw.signals as ContractComparisonDocument["knowledge"]["signals"],
          rules: knowledgeRaw.rules as ContractComparisonDocument["knowledge"]["rules"],
        }
      : {
          scanned_at: new Date(0).toISOString(),
          signal_count: 0,
          rule_count: 0,
          signals: [],
          rules: [],
        };

  return {
    id: value.id,
    file_name: value.file_name,
    client_name: asString(value.client_name, "Sin cliente"),
    folder_name: asString(value.folder_name, "General"),
    contract_type: typeof value.contract_type === "string" ? value.contract_type : null,
    party_a: typeof value.party_a === "string" ? value.party_a : null,
    party_b: typeof value.party_b === "string" ? value.party_b : null,
    starts_at: typeof value.starts_at === "string" ? value.starts_at : null,
    expires_at: typeof value.expires_at === "string" ? value.expires_at : null,
    status: asString(value.status, "indexed"),
    knowledge,
  };
}

export function parseContractComparisonResponse(
  raw: unknown,
): ContractComparisonResponse | null {
  if (!isRecord(raw)) {
    return null;
  }

  const result = parseContractComparisonResult(raw.result);
  const base = parseComparisonDocument(raw.base);
  const compared = parseComparisonDocument(raw.compared);

  if (!result || !base || !compared) {
    return null;
  }

  if (typeof raw.comparison_id !== "string" || typeof raw.generated_at !== "string") {
    return null;
  }

  return {
    comparison_id: raw.comparison_id,
    generated_at: raw.generated_at,
    base,
    compared,
    result,
  };
}

export function buildDeterministicDifferences(
  base: ComparisonContractInput,
  compared: ComparisonContractInput,
): DeterministicDifference[] {
  const fields: Array<[keyof ComparisonContractInput, string]> = [
    ["party_a", "Parte A"],
    ["party_b", "Parte B"],
    ["starts_at", "Fecha de inicio indexada"],
    ["expires_at", "Fecha de fin indexada"],
    ["auto_renewal", "Renovación automática"],
    ["renewal_notice_days", "Días de preaviso"],
  ];

  return fields.flatMap(([key, label]) => {
    const baseValue = formatComparableValue(base[key]);
    const comparedValue = formatComparableValue(compared[key]);

    if (baseValue === comparedValue) {
      return [];
    }

    return [
      {
        campo: label,
        contrato_base: baseValue,
        contrato_comparado: comparedValue,
        ...(key === "starts_at" || key === "expires_at"
          ? {
              nota:
                "Fecha extraída automáticamente. Requiere verificación textual antes de tratarla como cambio contractual.",
            }
          : {}),
      },
    ];
  });
}

export function buildComparisonReportMarkdown(
  comparison: ContractComparisonResponse,
): string {
  const lines: string[] = [
    "# Informe comparativo contractual",
    "",
    `**Contrato base:** ${comparison.base.file_name}`,
    `**Cliente base:** ${comparison.base.client_name}`,
    `**Contrato comparado:** ${comparison.compared.file_name}`,
    `**Cliente comparado:** ${comparison.compared.client_name}`,
    `**Generado:** ${comparison.generated_at}`,
    "",
    "## Resumen ejecutivo",
    "",
    comparison.result.resumen_ejecutivo,
    "",
    "## Riesgo comparativo",
    "",
    `- Documento más riesgoso: ${comparison.result.riesgo_comparativo.documento_mas_riesgoso}`,
    `- Score base: ${comparison.result.riesgo_comparativo.score_base}/100`,
    `- Score comparado: ${comparison.result.riesgo_comparativo.score_comparado}/100`,
    `- Motivo: ${comparison.result.riesgo_comparativo.motivo}`,
    "",
    "## Cambios críticos",
    "",
  ];

  if (comparison.result.cambios_criticos.length === 0) {
    lines.push("_Sin cambios críticos detectados._", "");
  } else {
    comparison.result.cambios_criticos.forEach((change, index) => {
      lines.push(
        `### ${index + 1}. ${change.titulo} — ${change.nivel}`,
        "",
        `- Categoría: ${change.categoria}`,
        `- Base: ${change.contrato_base}`,
        `- Comparado: ${change.contrato_comparado}`,
        `- Impacto: ${change.impacto}`,
        `- Sugerencia: ${change.sugerencia}`,
        "",
      );
    });
  }

  lines.push("## Diferencias operativas", "");
  comparison.result.diferencias_operativas.forEach((difference) => {
    lines.push(
      `- **${difference.campo}:** ${difference.contrato_base} → ${difference.contrato_comparado}. ${difference.relevancia}`,
    );
  });

  lines.push("", "## Recomendaciones", "");
  comparison.result.recomendaciones.forEach((recommendation) => {
    lines.push(`- ${recommendation}`);
  });

  lines.push("", "---", "", `_Generado por Vertia Legal — ${new Date().toISOString().slice(0, 10)}_`);
  return lines.join("\n");
}

export function buildComparisonReportHtml(
  comparison: ContractComparisonResponse,
): string {
  const markdown = buildComparisonReportMarkdown(comparison);
  const title = `Comparativo — ${comparison.base.file_name} vs ${comparison.compared.file_name}`;
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/_(.+?)_/g, "<em>$1</em>");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 2rem; color: #0f172a; line-height: 1.6; }
    h1, h2, h3 { color: #0e7490; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <p>${escaped}</p>
</body>
</html>`;
}
