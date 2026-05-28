"use client";

import { useState } from "react";
import type { ContractAnalysisResult } from "@/lib/contracts/analysis";
import { scoreToSemaphoreLevel } from "@/components/hud/SemaphoreHeatmapCard";
import { ClausulaCard } from "./ClausulaCard";
import { RiskScoreGauge } from "./RiskScoreGauge";

interface ContractAnalysisDashboardProps {
  analysis: ContractAnalysisResult;
}

export function ContractAnalysisDashboard({
  analysis,
}: ContractAnalysisDashboardProps) {
  const [activeClauseIndex, setActiveClauseIndex] = useState<number | null>(
    null,
  );

  const redClauses = analysis.clausulas_riesgo.filter(
    (item) => item.tipo === "rojo",
  );
  const yellowClauses = analysis.clausulas_riesgo.filter(
    (item) => item.tipo === "amarillo",
  );

  return (
    <div className="space-y-6">
      <div className="corp-panel grid gap-6 p-6 md:grid-cols-[auto_1fr]">
        <RiskScoreGauge
          score={analysis.score_riesgo}
          level={scoreToSemaphoreLevel(analysis.score_riesgo)}
        />
        <div>
          <h2 className="corp-label mb-3">Resumen ejecutivo</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            {analysis.resumen_directorio}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-corp border border-red-200 bg-red-50 px-3 py-1.5 font-medium text-red-800">
              {redClauses.length} cláusulas críticas
            </span>
            <span className="rounded-corp border border-amber-200 bg-amber-50 px-3 py-1.5 font-medium text-amber-900">
              {yellowClauses.length} advertencias
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="corp-label mb-3">Cláusulas de riesgo alto</h3>
          <div className="space-y-3">
            {redClauses.length > 0 ? (
              analysis.clausulas_riesgo
                .map((clausula, index) => ({ clausula, index }))
                .filter(({ clausula }) => clausula.tipo === "rojo")
                .map(({ clausula, index }) => (
                  <ClausulaCard
                    key={`red-${index}`}
                    clausula={clausula}
                    index={index}
                    isActive={activeClauseIndex === index}
                    onSelect={setActiveClauseIndex}
                  />
                ))
            ) : (
              <p className="text-sm text-corp-muted">
                Sin cláusulas críticas detectadas.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="corp-label mb-3">Cláusulas con advertencias</h3>
          <div className="space-y-3">
            {yellowClauses.length > 0 ? (
              analysis.clausulas_riesgo
                .map((clausula, index) => ({ clausula, index }))
                .filter(({ clausula }) => clausula.tipo === "amarillo")
                .map(({ clausula, index }) => (
                  <ClausulaCard
                    key={`yellow-${index}`}
                    clausula={clausula}
                    index={index}
                    isActive={activeClauseIndex === index}
                    onSelect={setActiveClauseIndex}
                  />
                ))
            ) : (
              <p className="text-sm text-corp-muted">
                Sin advertencias preventivas detectadas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
