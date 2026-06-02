export type LegalKnowledgeArea =
  | "civil_comercial"
  | "consumo"
  | "laboral"
  | "moneda"
  | "procesal"
  | "operativo";

export type LegalRiskLevel = "alto" | "medio" | "bajo";

/** Grado de certeza con que Vertia puede aplicar la regla sin revisión humana adicional. */
export type LegalConfidenceLevel =
  | "verificado"
  | "interpretativo"
  | "requiere_verificacion";

export interface LegalRule {
  id: string;
  area: LegalKnowledgeArea;
  /** Etiquetas para cruce con señales detectadas en el texto. */
  tags: string[];
  norma: string;
  fuente: string;
  verificadoEn: string;
  riesgo: LegalRiskLevel;
  confianza: LegalConfidenceLevel;
  titulo: string;
  regla: string;
  accionAuditoria: string;
}

export interface DetectedSignal {
  id: string;
  tag: string;
  descripcion: string;
  /** Extracto del contrato que activó la señal (máx. ~200 chars). */
  evidencia: string | null;
}

export interface ContractKnowledgeScan {
  signals: DetectedSignal[];
  /** Reglas internas aplicables según señales detectadas. */
  applicableRules: LegalRule[];
  scannedAt: string;
}

/** Snapshot serializable persistido en analysis_result e historial de auditorías. */
export interface ContractKnowledgeSnapshot {
  scanned_at: string;
  signal_count: number;
  rule_count: number;
  signals: Array<{
    id: string;
    tag: string;
    descripcion: string;
    evidencia: string | null;
  }>;
  rules: Array<{
    id: string;
    titulo: string;
    norma: string;
    fuente: string;
    riesgo: LegalRiskLevel;
    confianza: LegalConfidenceLevel;
    regla: string;
  }>;
}
