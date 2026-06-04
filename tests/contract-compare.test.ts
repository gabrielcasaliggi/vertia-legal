import { describe, expect, it } from "vitest";
import {
  buildDeterministicDifferences,
  parseContractComparisonResult,
  type ComparisonContractInput,
} from "@/lib/contracts/compare";

const baseContract: ComparisonContractInput = {
  file_name: "contrato-viejo.pdf",
  client_name: "Cliente A",
  folder_name: "Proveedores",
  contract_type: "Servicios",
  party_a: "Cliente A",
  party_b: "Proveedor S.A.",
  starts_at: "2024-01-01",
  expires_at: "2025-01-01",
  auto_renewal: false,
  renewal_notice_days: 60,
};

describe("contract comparison", () => {
  it("detecta diferencias determinísticas de metadatos", () => {
    const differences = buildDeterministicDifferences(baseContract, {
      ...baseContract,
      file_name: "contrato-nuevo.pdf",
      expires_at: "2026-01-01",
      auto_renewal: true,
      renewal_notice_days: 15,
    });

    expect(differences).toEqual(
      expect.arrayContaining([
        {
          campo: "Fecha de fin indexada",
          contrato_base: "01/01/2025",
          contrato_comparado: "01/01/2026",
          nota:
            "Fecha extraída automáticamente. Requiere verificación textual antes de tratarla como cambio contractual.",
        },
        {
          campo: "Renovación automática",
          contrato_base: "No",
          contrato_comparado: "Sí",
        },
        {
          campo: "Días de preaviso",
          contrato_base: "60",
          contrato_comparado: "15",
        },
      ]),
    );
  });

  it("normaliza una respuesta válida del LLM", () => {
    const result = parseContractComparisonResult({
      resumen_ejecutivo: "El contrato nuevo aumenta riesgo por menor preaviso.",
      riesgo_comparativo: {
        documento_mas_riesgoso: "comparado",
        score_base: 42,
        score_comparado: 71,
        motivo: "Agrega penalidad y reduce preaviso.",
      },
      cambios_criticos: [
        {
          categoria: "rescisión",
          titulo: "Reducción de preaviso",
          contrato_base: "60 días",
          contrato_comparado: "15 días",
          impacto: "Menor margen operativo.",
          sugerencia: "Negociar preaviso mayor.",
          nivel: "alto",
        },
      ],
      diferencias_operativas: [
        {
          campo: "Vencimiento",
          contrato_base: "2025-01-01",
          contrato_comparado: "2026-01-01",
          relevancia: "Actualizar alertas.",
        },
      ],
      clausulas_agregadas: ["Penalidad por incumplimiento"],
      clausulas_eliminadas: ["Confidencialidad postcontractual"],
      clausulas_modificadas: ["Jurisdicción"],
      recomendaciones: ["Revisar penalidades antes de firmar."],
    });

    expect(result?.riesgo_comparativo.documento_mas_riesgoso).toBe("comparado");
    expect(result?.cambios_criticos[0]?.nivel).toBe("alto");
    expect(result?.recomendaciones).toHaveLength(1);
  });

  it("rechaza estructuras sin riesgo comparativo", () => {
    expect(parseContractComparisonResult({ resumen_ejecutivo: "incompleto" })).toBeNull();
  });

  it("baja cambios de vigencia no verificados a diferencias operativas", () => {
    const result = parseContractComparisonResult({
      resumen_ejecutivo: "Hay diferencia de vigencia indexada.",
      riesgo_comparativo: {
        documento_mas_riesgoso: "equilibrado",
        score_base: 30,
        score_comparado: 30,
        motivo: "Sin evidencia suficiente para elevar la diferencia.",
      },
      cambios_criticos: [
        {
          categoria: "vigencia",
          titulo: "Cambio en la vigencia del contrato",
          contrato_base: "2018-2022",
          contrato_comparado: "1996-2012",
          impacto: "Puede afectar la duración del contrato.",
          sugerencia: "Revisar vigencia.",
          nivel: "medio",
        },
      ],
      diferencias_operativas: [],
      clausulas_agregadas: [],
      clausulas_eliminadas: [],
      clausulas_modificadas: [],
      recomendaciones: [],
    });

    expect(result?.cambios_criticos).toHaveLength(0);
    expect(result?.diferencias_operativas[0]?.relevancia).toContain(
      "requiere verificación",
    );
  });
});
