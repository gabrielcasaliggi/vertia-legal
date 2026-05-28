"use client";

import { useEffect, useState } from "react";
import {
  INDEXING_PIPELINE_PHASES,
  type ProcessingPhase,
} from "@/lib/contracts/pipeline-phases";

interface PipelineLoadingStateProps {
  fileName?: string;
  currentPhase?: ProcessingPhase;
  mode?: "indexing" | "cognitive";
}

export function PipelineLoadingState({
  fileName,
  currentPhase,
  mode = "indexing",
}: PipelineLoadingStateProps) {
  const phases =
    mode === "cognitive"
      ? [
          {
            id: "ai_analysis" as ProcessingPhase,
            label: "Auditoría cognitiva",
            detail: "Procesando el contrato con el modelo de análisis jurídico...",
          },
        ]
      : INDEXING_PIPELINE_PHASES;

  const [animatedPhaseIndex, setAnimatedPhaseIndex] = useState(0);

  useEffect(() => {
    if (currentPhase) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setAnimatedPhaseIndex((previous) => (previous + 1) % phases.length);
    }, 2400);

    return () => window.clearInterval(intervalId);
  }, [currentPhase, phases.length]);

  const activePhase = currentPhase ?? phases[animatedPhaseIndex]?.id ?? "computing_hash";
  const activePhaseIndex = phases.findIndex((phase) => phase.id === activePhase);
  const phaseDefinition =
    phases.find((phase) => phase.id === activePhase) ?? phases[0];

  return (
    <div className="corp-panel flex min-h-[320px] flex-col items-center justify-center p-10">
      <p className="corp-label">
        {mode === "cognitive" ? "Auditoría en proceso" : "Indexación en proceso"}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-corp-text">
        {phaseDefinition?.label}
      </h3>
      <p className="mt-2 max-w-lg text-center text-sm leading-relaxed text-corp-muted">
        {phaseDefinition?.detail}
      </p>
      {fileName && <p className="mt-3 text-sm font-medium text-corp-text">{fileName}</p>}

      <div className="mt-8 w-full max-w-md space-y-2">
        {phases.map((phase, index) => {
          const isComplete = index < activePhaseIndex;
          const isActive = phase.id === activePhase;

          return (
            <div
              key={phase.id}
              className={`flex items-center gap-3 rounded-corp border px-4 py-3 text-sm ${
                isActive
                  ? "border-slate-300 bg-corp-surface text-corp-text"
                  : isComplete
                    ? "border-corp-border bg-corp-panel text-corp-muted"
                    : "border-corp-border text-slate-400"
              }`}
            >
              <span
                className={
                  isActive
                    ? "status-dot-amber"
                    : isComplete
                      ? "status-dot-emerald"
                      : "status-dot-neutral"
                }
                aria-hidden
              />
              {phase.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
