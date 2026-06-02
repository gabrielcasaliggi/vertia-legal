export type {
  ContractKnowledgeScan,
  DetectedSignal,
  LegalConfidenceLevel,
  LegalKnowledgeArea,
  LegalRiskLevel,
  LegalRule,
} from "@/lib/legal-knowledge/types";

export {
  LEGAL_KNOWLEDGE_RULES,
  getLegalRuleById,
  getLegalRulesByTag,
} from "@/lib/legal-knowledge/rules";

export { scanContractKnowledge } from "@/lib/legal-knowledge/detect-signals";

export {
  augmentAssistedQueryContext,
  augmentAuditorSystemPrompt,
  buildKnowledgeAuditContext,
} from "@/lib/legal-knowledge/build-audit-context";

export {
  attachKnowledgeToAnalysis,
  snapshotKnowledgeScan,
} from "@/lib/legal-knowledge/snapshot";
