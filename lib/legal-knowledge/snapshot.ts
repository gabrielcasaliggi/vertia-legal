import type {
  ContractKnowledgeScan,
  ContractKnowledgeSnapshot,
} from "@/lib/legal-knowledge/types";
import type { ContractAnalysisResult } from "@/lib/contracts/analysis";

export function snapshotKnowledgeScan(
  scan: ContractKnowledgeScan,
): ContractKnowledgeSnapshot {
  return {
    scanned_at: scan.scannedAt,
    signal_count: scan.signals.length,
    rule_count: scan.applicableRules.length,
    signals: scan.signals.map((signal) => ({
      id: signal.id,
      tag: signal.tag,
      descripcion: signal.descripcion,
      evidencia: signal.evidencia,
    })),
    rules: scan.applicableRules.map((rule) => ({
      id: rule.id,
      titulo: rule.titulo,
      norma: rule.norma,
      fuente: rule.fuente,
      riesgo: rule.riesgo,
      confianza: rule.confianza,
      regla: rule.regla,
    })),
  };
}

export function attachKnowledgeToAnalysis(
  analysis: ContractAnalysisResult,
  scan: ContractKnowledgeScan,
): ContractAnalysisResult {
  return {
    ...analysis,
    conocimiento_vertia: snapshotKnowledgeScan(scan),
  };
}
