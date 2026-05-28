export type ProcessingPhase =
  | "uploading_storage"
  | "computing_hash"
  | "extracting_text"
  | "registering_record"
  | "indexing_search"
  | "ai_analysis"
  | "completed"
  | "failed";

export interface PipelinePhaseDefinition {
  id: ProcessingPhase;
  label: string;
  detail: string;
}

export const INDEXING_PIPELINE_PHASES: PipelinePhaseDefinition[] = [
  {
    id: "computing_hash",
    label: "Integridad Criptográfica",
    detail: "Calculando Hash criptográfico SHA-256...",
  },
  {
    id: "extracting_text",
    label: "Extracción Documental",
    detail: "Indexando matriz textual del contrato (pdf-parse / OCR local)...",
  },
  {
    id: "uploading_storage",
    label: "Vault Seguro",
    detail: "Resguardando PDF en Supabase Storage privado...",
  },
  {
    id: "registering_record",
    label: "Indexación LexCORE",
    detail: "Persistiendo metadatos y texto extraído en PostgreSQL...",
  },
  {
    id: "indexing_search",
    label: "Motor de Búsqueda Soberano",
    detail: "Generando índice Full-Text Search en español (tokens = 0)...",
  },
];

export const COGNITIVE_PIPELINE_PHASES: PipelinePhaseDefinition[] = [
  {
    id: "ai_analysis",
    label: "Auditoría Cognitiva",
    detail: "Ejecutando auditoría cognitiva con Llama 3 vía Groq...",
  },
];

export function getPhaseDefinition(
  phase: ProcessingPhase,
  mode: "indexing" | "cognitive" = "indexing",
): PipelinePhaseDefinition | undefined {
  const phases =
    mode === "cognitive" ? COGNITIVE_PIPELINE_PHASES : INDEXING_PIPELINE_PHASES;
  return phases.find((item) => item.id === phase);
}

export const INDEXING_PHASE_ORDER: ProcessingPhase[] =
  INDEXING_PIPELINE_PHASES.map((phase) => phase.id);
