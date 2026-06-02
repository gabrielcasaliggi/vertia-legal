import type { LegalRule } from "@/lib/legal-knowledge/types";

/**
 * Catálogo conservador de reglas verificadas por Vertia.
 * Mantener pequeño, trazable y actualizable sin depender del LLM como fuente normativa.
 */
export const LEGAL_KNOWLEDGE_RULES: readonly LegalRule[] = [
  {
    id: "cccn-1743-dolo",
    area: "civil_comercial",
    tags: ["limitacion_responsabilidad", "exclusion_danos"],
    norma: "CCCN art. 1743",
    fuente: "InfoLeg — Ley 26.994",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "verificado",
    titulo: "Dispensa anticipada por dolo",
    regla:
      "Son inválidas las cláusulas que liberen anticipadamente del daño causado por dolo del deudor o de quienes debe responder.",
    accionAuditoria:
      "Marcar como riesgo alto toda cláusula que limite o excluya responsabilidad por dolo. Citar art. 1743 CCCN.",
  },
  {
    id: "ldc-art-37-abusivas",
    area: "consumo",
    tags: ["consumo", "renuncia_derechos", "limitacion_responsabilidad", "carga_probatoria"],
    norma: "Ley 24.240 art. 37",
    fuente: "InfoLeg — Ley 24.240",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "verificado",
    titulo: "Cláusulas abusivas en consumo",
    regla:
      "En relaciones de consumo se tendrán por no convenidas cláusulas que limiten responsabilidad, restrinjan derechos del consumidor o inviertan la carga probatoria en su perjuicio.",
    accionAuditoria:
      "Si hay indicios de consumo, revisar cláusulas limitativas bajo art. 37 LDC y arts. 985-989 CCCN.",
  },
  {
    id: "cccn-2654-foro-consumo",
    area: "consumo",
    tags: ["jurisdiccion_extranjera", "consumo"],
    norma: "CCCN art. 2654",
    fuente: "InfoLeg — Ley 26.994",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "verificado",
    titulo: "Prórroga de foro en consumo internacional",
    regla:
      "En relaciones de consumo con elemento internacional no se admite acuerdo de elección de foro en perjuicio del consumidor.",
    accionAuditoria:
      "Marcar cláusulas de jurisdicción/arbitraje extranjero cuando exista relación de consumo.",
  },
  {
    id: "cccn-1109-foro-distancia",
    area: "consumo",
    tags: ["jurisdiccion_extranjera", "contrato_adhesion", "consumo"],
    norma: "CCCN art. 1109",
    fuente: "InfoLeg — Ley 26.994",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "verificado",
    titulo: "Prórroga de jurisdicción en contratos a distancia",
    regla:
      "En contratos celebrados a distancia, la cláusula de prórroga de jurisdicción se tiene por no escrita.",
    accionAuditoria:
      "Verificar si el contrato es a distancia/adhesión digital y marcar prórrogas de jurisdicción.",
  },
  {
    id: "lct-art-12-irrenunciable",
    area: "laboral",
    tags: ["renuncia_derechos", "labor_encubierto"],
    norma: "LCT art. 12",
    fuente: "InfoLeg — Ley 20.744 (texto según Ley 27.802)",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "verificado",
    titulo: "Derechos laborales irrenunciables",
    regla:
      "Es nula toda convención que suprima o reduzca derechos previstos en la LCT, estatutos o CCT.",
    accionAuditoria:
      "Si hay indicios laborales, marcar renuncias anticipadas a créditos o derechos laborales.",
  },
  {
    id: "cccn-1088-intimacion",
    area: "civil_comercial",
    tags: ["resolucion_inmediata", "pacto_comisorio"],
    norma: "CCCN arts. 1083-1089",
    fuente: "InfoLeg — Ley 26.994",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "interpretativo",
    titulo: "Resolución contractual sin intimación",
    regla:
      "La resolución por incumplimiento suele requerir intimación previa con plazo razonable (art. 1088 CCCN), salvo supuestos legales específicos.",
    accionAuditoria:
      "Revisar cláusulas de resolución automática o inmediata por cualquier incumplimiento.",
  },
  {
    id: "cccn-moneda-extranjera-intertemporal",
    area: "moneda",
    tags: ["moneda_extranjera"],
    norma: "CCCN arts. 765-766 (reformados DNU 70/2023)",
    fuente: "Boletín Oficial — DNU 70/2023",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "requiere_verificacion",
    titulo: "Obligaciones en moneda extranjera",
    regla:
      "El régimen aplicable depende de la fecha de origen de la obligación: pre/post 30-dic-2023 rigen reglas distintas sobre pago en moneda pactada.",
    accionAuditoria:
      "No concluir vigencia automática. Indicar que requiere verificar fecha del contrato y régimen cambiario BCRA.",
  },
  {
    id: "cccn-adhesion-control",
    area: "civil_comercial",
    tags: ["contrato_adhesion"],
    norma: "CCCN arts. 984-989",
    fuente: "InfoLeg — Ley 26.994",
    verificadoEn: "2026-06-02",
    riesgo: "medio",
    confianza: "verificado",
    titulo: "Contrato de adhesión",
    regla:
      "En contratos de adhesión el predisponente no puede imponer cláusulas abusivas ni desequilibrios significativos.",
    accionAuditoria:
      "Identificar si es adhesión (T&C, formulario, plataforma) y endurecer revisión de cláusulas limitativas.",
  },
  {
    id: "posible-labor-encubierto",
    area: "laboral",
    tags: ["labor_encubierto", "prestacion_servicios"],
    norma: "LCT arts. 14, 21 y 23",
    fuente: "InfoLeg — Ley 20.744 (texto según Ley 27.802)",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "requiere_verificacion",
    titulo: "Posible relación laboral encubierta",
    regla:
      "Contratos de servicios con exclusividad, horario fijo, subordinación o uso de recursos del comitente pueden encubrir relación de dependencia.",
    accionAuditoria:
      "No concluir laboralidad automática. Marcar revisión profesional y verificar facturación, subordinación y encuadre normativo.",
  },
  {
    id: "renovacion-automatica",
    area: "operativo",
    tags: ["renovacion_automatica"],
    norma: "CCCN — obligaciones de tracto sucesivo",
    fuente: "Doctrina contractual / ciclo de vida Vertia",
    verificadoEn: "2026-06-02",
    riesgo: "medio",
    confianza: "interpretativo",
    titulo: "Renovación automática",
    regla:
      "La renovación tácita o automática exige controlar plazos, preaviso y mecanismo de oposición.",
    accionAuditoria:
      "Extraer plazo, mecanismo de renovación y días de preaviso. Alertar si no están definidos.",
  },
  {
    id: "penalidad-contractual",
    area: "civil_comercial",
    tags: ["penalidad"],
    norma: "CCCN arts. 793-799 (cláusula penal)",
    fuente: "InfoLeg — Ley 26.994",
    verificadoEn: "2026-06-02",
    riesgo: "medio",
    confianza: "interpretativo",
    titulo: "Cláusulas penales",
    regla:
      "Penalidades desproporcionadas o acumulables con indemnización plena pueden ser revisadas judicialmente.",
    accionAuditoria:
      "Identificar multas, penalidades o indemnizaciones predeterminadas y evaluar proporcionalidad.",
  },
  {
    id: "confidencialidad-sin-plazo",
    area: "civil_comercial",
    tags: ["confidencialidad_indefinida"],
    norma: "CCCN — determinación del objeto y plazo",
    fuente: "Doctrina contractual",
    verificadoEn: "2026-06-02",
    riesgo: "medio",
    confianza: "interpretativo",
    titulo: "Confidencialidad sin plazo",
    regla:
      "Obligaciones de confidencialidad sin plazo determinado o excesivamente extensas pueden generar impugnación parcial.",
    accionAuditoria:
      "Verificar duración, excepciones estándar (información pública, requerimiento judicial) y alcance.",
  },
  {
    id: "arbitraje-extranjero",
    area: "procesal",
    tags: ["arbitraje_extranjero", "jurisdiccion_extranjera"],
    norma: "Ley 27.449 / Ley 23.619",
    fuente: "InfoLeg",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "requiere_verificacion",
    titulo: "Arbitraje o jurisdicción extranjera",
    regla:
      "Cláusulas arbitrales o de jurisdicción extranjera requieren análisis de arbitrabilidad, orden público y relación de consumo.",
    accionAuditoria:
      "Marcar para revisión específica. No validar ejecutabilidad sin análisis del caso.",
  },
  {
    id: "modificacion-unilateral",
    area: "consumo",
    tags: ["modificacion_unilateral", "contrato_adhesion"],
    norma: "Ley 24.240 art. 37 inc. a",
    fuente: "InfoLeg — Ley 24.240",
    verificadoEn: "2026-06-02",
    riesgo: "alto",
    confianza: "verificado",
    titulo: "Modificación unilateral de condiciones",
    regla:
      "Cláusulas que permiten al predisponente modificar precio o condiciones unilateralmente suelen ser abusivas en consumo.",
    accionAuditoria:
      "Marcar modificaciones unilaterales de precio, SLA, alcance o condiciones esenciales.",
  },
  {
    id: "ausencia-preaviso-rescision",
    area: "operativo",
    tags: ["sin_preaviso"],
    norma: "CCCN — extinción y plazos de preaviso",
    fuente: "Doctrina contractual / ciclo de vida Vertia",
    verificadoEn: "2026-06-02",
    riesgo: "medio",
    confianza: "interpretativo",
    titulo: "Rescisión sin preaviso",
    regla:
      "Contratos de tracto sucesivo deberían definir causales, preaviso y efectos de rescisión.",
    accionAuditoria:
      "Verificar si existen plazos de preaviso y causales de terminación.",
  },
  {
    id: "cccn-prescripcion",
    area: "civil_comercial",
    tags: ["prescripcion_contractual"],
    norma: "CCCN arts. 2532-2534",
    fuente: "InfoLeg — Ley 26.994",
    verificadoEn: "2026-06-02",
    riesgo: "medio",
    confianza: "verificado",
    titulo: "Modificación de plazos de prescripción",
    regla:
      "Las partes no pueden eliminar la prescripción ni fijar plazos irrazonables fuera de los límites legales.",
    accionAuditoria:
      "Revisar cláusulas que acorten o renuncien a plazos de prescripción.",
  },
] as const;

const RULES_BY_ID = new Map<string, LegalRule>(
  LEGAL_KNOWLEDGE_RULES.map((rule) => [rule.id, rule]),
);

export function getLegalRuleById(id: string): LegalRule | undefined {
  return RULES_BY_ID.get(id);
}

export function getLegalRulesByTag(tag: string): LegalRule[] {
  return LEGAL_KNOWLEDGE_RULES.filter((rule) => rule.tags.includes(tag));
}
