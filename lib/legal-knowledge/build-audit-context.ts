import type { ContractKnowledgeScan } from "@/lib/legal-knowledge/types";

const MAX_RULES_IN_PROMPT = 8;
const MAX_SIGNALS_IN_PROMPT = 10;

function formatSignalsSection(scan: ContractKnowledgeScan): string {
  if (scan.signals.length === 0) {
    return "Señales detectadas por Vertia: ninguna señal estructurada automática.";
  }

  const lines = scan.signals.slice(0, MAX_SIGNALS_IN_PROMPT).map((signal, index) => {
    const evidence = signal.evidencia ? `\n   Extracto: "${signal.evidencia}"` : "";
    return `${index + 1}. [${signal.tag}] ${signal.descripcion}${evidence}`;
  });

  return `Señales detectadas por Vertia (motor propio, previo al LLM):\n${lines.join("\n")}`;
}

function formatRulesSection(scan: ContractKnowledgeScan): string {
  if (scan.applicableRules.length === 0) {
    return "Reglas internas aplicables: ninguna regla del catálogo Vertia se activó automáticamente. Aplicá criterio CCCN general.";
  }

  const lines = scan.applicableRules.slice(0, MAX_RULES_IN_PROMPT).map((rule, index) => {
    return [
      `${index + 1}. ${rule.id} — ${rule.titulo}`,
      `   Norma: ${rule.norma} (fuente: ${rule.fuente}, verificado: ${rule.verificadoEn})`,
      `   Riesgo: ${rule.riesgo} | Confianza Vertia: ${rule.confianza}`,
      `   Regla: ${rule.regla}`,
      `   Acción: ${rule.accionAuditoria}`,
    ].join("\n");
  });

  const truncated =
    scan.applicableRules.length > MAX_RULES_IN_PROMPT
      ? `\n[... ${scan.applicableRules.length - MAX_RULES_IN_PROMPT} reglas adicionales omitidas por límite de contexto ...]`
      : "";

  return `Reglas internas Vertia aplicables:\n${lines.join("\n\n")}${truncated}`;
}

export function buildKnowledgeAuditContext(scan: ContractKnowledgeScan): string {
  return [
    "=== CAPA DE CONOCIMIENTO VERTIA (NO INVENTAR NORMAS FUERA DE ESTE BLOQUE) ===",
    "Usá estas señales y reglas como base prioritaria. Si una regla tiene confianza 'requiere_verificacion', indicá la limitación en motivo o sugerencia.",
    "No cites jurisprudencia ni montos indexados. No afirmes vigencia normativa sin respaldo del catálogo.",
    "",
    formatSignalsSection(scan),
    "",
    formatRulesSection(scan),
    "=== FIN CAPA DE CONOCIMIENTO VERTIA ===",
  ].join("\n");
}

export function augmentAuditorSystemPrompt(
  basePrompt: string,
  scan: ContractKnowledgeScan,
): string {
  if (scan.signals.length === 0 && scan.applicableRules.length === 0) {
    return `${basePrompt}

NOTA VERTIA: El motor de conocimiento propio no detectó señales estructuradas. Auditá con criterio CCCN/LDC/LCT según el texto. No inventes normas ni jurisprudencia.`;
  }

  return `${basePrompt}

${buildKnowledgeAuditContext(scan)}`;
}

export function augmentAssistedQueryContext(scan: ContractKnowledgeScan): string {
  if (scan.signals.length === 0 && scan.applicableRules.length === 0) {
    return "";
  }

  const signalSummary = scan.signals
    .slice(0, 4)
    .map((s) => s.descripcion)
    .join("; ");

  const ruleSummary = scan.applicableRules
    .slice(0, 3)
    .map((r) => `${r.titulo} (${r.norma})`)
    .join("; ");

  return [
    "CONTEXTO DEL MOTOR DE CONOCIMIENTO VERTIA:",
    signalSummary ? `Señales: ${signalSummary}.` : "",
    ruleSummary ? `Reglas internas: ${ruleSummary}.` : "",
    "Priorizá estas señales al responder. Si falta certeza normativa, marcá contexto_insuficiente o advertí revisión profesional.",
  ]
    .filter(Boolean)
    .join("\n");
}
