import type { SemaphoreLevel } from "@/components/hud/SemaphoreHeatmapCard";

interface RiskScoreGaugeProps {
  score: number;
  level?: SemaphoreLevel;
}

const LEVEL_LABELS: Record<SemaphoreLevel, string> = {
  idle: "Sin datos",
  low: "Exposición baja",
  moderate: "Exposición moderada",
  high: "Exposición elevada",
  critical: "Exposición crítica",
};

const STATUS_DOT: Record<SemaphoreLevel, string> = {
  idle: "status-dot-neutral",
  low: "status-dot-emerald",
  moderate: "status-dot-amber",
  high: "status-dot-amber",
  critical: "status-dot-terracotta",
};

function scoreToLevel(score: number): SemaphoreLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

export function RiskScoreGauge({ score, level }: RiskScoreGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const resolvedLevel = level ?? scoreToLevel(normalizedScore);

  return (
    <div
      className="rounded-corp border border-corp-border bg-corp-surface px-6 py-5"
      aria-label={`Score de riesgo: ${normalizedScore}`}
    >
      <p className="corp-label">Indicador de riesgo</p>

      <div className="mt-4 flex items-start gap-3">
        <span className={`${STATUS_DOT[resolvedLevel]} mt-1.5`} aria-hidden />
        <div>
          <p className="text-sm font-semibold text-corp-text">
            {LEVEL_LABELS[resolvedLevel]}
          </p>
          <p className="mt-1 text-xs text-corp-muted">Auditoría cognitiva</p>
        </div>
      </div>

      <div className="mt-5 border-t border-corp-border pt-4">
        <p className="text-xs font-medium text-corp-muted">Valor del indicador</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-corp-text">
          {normalizedScore}
        </p>
      </div>
    </div>
  );
}
