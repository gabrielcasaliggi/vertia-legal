import { describe, expect, it } from "vitest";
import {
  augmentAuditorSystemPrompt,
  buildKnowledgeAuditContext,
  getLegalRuleById,
  scanContractKnowledge,
  snapshotKnowledgeScan,
} from "@/lib/legal-knowledge";
import { parseContractAnalysisResult } from "@/lib/contracts/analysis";

describe("scanContractKnowledge", () => {
  it("detecta limitación de responsabilidad y activa regla CCCN art. 1743", () => {
    const text =
      "En ningún caso la parte proveedora será responsable por daños indirectos o consecuenciales.";

    const scan = scanContractKnowledge(text);

    expect(scan.signals.some((s) => s.tag === "limitacion_responsabilidad")).toBe(true);
    expect(scan.applicableRules.some((r) => r.id === "cccn-1743-dolo")).toBe(true);
  });

  it("detecta jurisdicción extranjera y reglas de consumo/procesal", () => {
    const text =
      "Any dispute shall be submitted to the exclusive jurisdiction of the courts of Delaware. El usuario acepta los términos y condiciones.";

    const scan = scanContractKnowledge(text);

    expect(scan.signals.some((s) => s.tag === "jurisdiccion_extranjera")).toBe(true);
    expect(scan.applicableRules.some((r) => r.id === "arbitraje-extranjero")).toBe(true);
  });

  it("detecta indicios laborales sin concluir laboralidad automática", () => {
    const text =
      "Contrato de locación de servicios. El prestador deberá cumplir horario de 9 a 18 hs con exclusividad.";

    const scan = scanContractKnowledge(text);

    expect(scan.signals.some((s) => s.tag === "labor_encubierto")).toBe(true);
    expect(scan.applicableRules.some((r) => r.id === "posible-labor-encubierto")).toBe(
      true,
    );
    expect(getLegalRuleById("posible-labor-encubierto")?.confianza).toBe(
      "requiere_verificacion",
    );
  });

  it("devuelve scan vacío en texto neutro", () => {
    const scan = scanContractKnowledge("Contrato de compraventa de bienes muebles entre partes.");

    expect(scan.signals).toHaveLength(0);
    expect(scan.applicableRules).toHaveLength(0);
  });
});

describe("buildKnowledgeAuditContext", () => {
  it("incluye señales y reglas en el bloque de contexto", () => {
    const scan = scanContractKnowledge(
      "Renovación automática por períodos iguales. Precio en dólares USD.",
    );

    const context = buildKnowledgeAuditContext(scan);

    expect(context).toContain("CAPA DE CONOCIMIENTO VERTIA");
    expect(context).toContain("renovacion_automatica");
    expect(context).toContain("cccn-moneda-extranjera-intertemporal");
  });
});

describe("snapshotKnowledgeScan", () => {
  it("serializa scan para persistencia", () => {
    const scan = scanContractKnowledge(
      "Renovación automática. Precio en dólares USD. Multa por incumplimiento.",
    );
    const snapshot = snapshotKnowledgeScan(scan);

    expect(snapshot.signal_count).toBeGreaterThan(0);
    expect(snapshot.scanned_at).toBeTruthy();
    expect(snapshot.signals[0]?.tag).toBeTruthy();
  });
});

describe("parseContractAnalysisResult con conocimiento_vertia", () => {
  it("preserva snapshot Vertia en analysis_result", () => {
    const scan = scanContractKnowledge("Jurisdicción exclusiva de Delaware.");
    const snapshot = snapshotKnowledgeScan(scan);

    const parsed = parseContractAnalysisResult({
      score_riesgo: 42,
      clausulas_riesgo: [],
      resumen_directorio: "Resumen de prueba con contenido suficiente.",
      conocimiento_vertia: snapshot,
    });

    expect(parsed?.conocimiento_vertia?.signal_count).toBe(snapshot.signal_count);
  });
});
