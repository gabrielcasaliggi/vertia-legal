interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  variant?: "metric" | "panel";
}

export function StatCard({
  label,
  value,
  hint,
  accent = "bg-cyan-500",
  variant = "metric",
}: StatCardProps) {
  const containerClass =
    variant === "metric"
      ? "metric-card group"
      : "corp-panel ops-panel-accent p-5";

  return (
    <div className={containerClass}>
      <div className={`mb-4 h-1 w-12 rounded-full ${accent}`} />
      <p className="corp-label text-cyan-700">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-corp-text">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-corp-muted">{hint}</p> : null}
    </div>
  );
}
