import type { ContractAnalysisResult } from "@/lib/contracts/analysis";

const LOW_QUALITY_SIGNALS = [
  "no se proporciona informacion",
  "no se proporciona información",
  "falta de informacion",
  "falta de información",
  "sin informacion suficiente",
  "sin información suficiente",
  "solicitar el texto completo",
  "no se puede realizar un analisis",
  "no se puede realizar un análisis",
  "imposible evaluar el riesgo",
  "no hay informacion",
  "no hay información",
];

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function isLowQualityAnalysis(
  analysis: ContractAnalysisResult,
): boolean {
  const combined = normalizeForMatch(
    [
      analysis.resumen_directorio,
      ...analysis.clausulas_riesgo.map(
        (clause) =>
          `${clause.texto_original} ${clause.motivo} ${clause.sugerencia}`,
      ),
    ].join(" "),
  );

  const hasEmptySignal = LOW_QUALITY_SIGNALS.some((signal) =>
    combined.includes(normalizeForMatch(signal)),
  );

  const hasWeakClauses =
    analysis.clausulas_riesgo.length <= 1 &&
    analysis.clausulas_riesgo.every((clause) =>
      LOW_QUALITY_SIGNALS.some((signal) =>
        normalizeForMatch(clause.texto_original).includes(
          normalizeForMatch(signal),
        ),
      ),
    );

  return hasEmptySignal && (hasWeakClauses || analysis.score_riesgo === 50);
}
