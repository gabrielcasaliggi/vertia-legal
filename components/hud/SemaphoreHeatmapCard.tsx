export type SemaphoreLevel = "idle" | "low" | "moderate" | "high" | "critical";

interface SemaphoreHeatmapCardProps {
  title: string;
  level: SemaphoreLevel;
  score?: number;
  subtitle?: string;
  idleMessage?: string;
}

const LEVEL_LABELS: Record<SemaphoreLevel, string> = {
  idle: "Sin datos disponibles",
  low: "Exposición baja",
  moderate: "Exposición moderada",
  high: "Exposición elevada",
  critical: "Exposición crítica",
};

const LEVEL_DESCRIPTION: Record<SemaphoreLevel, string> = {
  idle: "Aguardando información contractual indexada.",
  low: "El indicador no registra alertas relevantes en el período analizado.",
  moderate: "Se recomienda revisión preventiva de las cláusulas vinculadas.",
  high: "Se requiere atención prioritaria del área legal.",
  critical: "Intervención inmediata recomendada por proximidad de vencimiento o riesgo.",
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

export function scoreToSemaphoreLevel(score: number): SemaphoreLevel {
  return scoreToLevel(score);
}

export function SemaphoreHeatmapCard({
  title,
  level,
  score,
  subtitle,
  idleMessage = "Esperando indexación de documento...",
}: SemaphoreHeatmapCardProps) {
  const isIdle = level === "idle";

  return (
    <article className="corp-panel p-6">
      <div className="border-b border-corp-border pb-5">
        <p className="corp-label">{title}</p>
        {subtitle && (
          <p className="mt-2 text-sm text-corp-muted">{subtitle}</p>
        )}
      </div>

      <div className="mt-5">
        {isIdle ? (
          <div className="flex items-start gap-3">
            <span className="status-dot-neutral mt-1.5" aria-hidden />
            <p className="text-sm leading-relaxed text-corp-muted">{idleMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={STATUS_DOT[level]} aria-hidden />
              <div>
                <p className="text-sm font-semibold text-corp-text">
                  {LEVEL_LABELS[level]}
                </p>
                <p className="mt-1 text-sm text-corp-muted">
                  {LEVEL_DESCRIPTION[level]}
                </p>
              </div>
            </div>

            {score !== undefined && (
              <div className="rounded-corp border border-corp-border bg-corp-surface px-4 py-3">
                <p className="text-xs font-medium text-corp-muted">
                  Valor del indicador
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-corp-text">
                  {score}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
