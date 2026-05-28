import type { ClausulaRiesgo } from "@/lib/contracts/analysis";

interface ClausulaCardProps {
  clausula: ClausulaRiesgo;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
}

const stylesByTipo = {
  rojo: {
    container:
      "border-red-200 bg-red-50/60 hover:border-red-300 hover:bg-red-50",
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "status-dot-terracotta",
    label: "Riesgo alto",
  },
  amarillo: {
    container:
      "border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:bg-amber-50",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    dot: "status-dot-amber",
    label: "Advertencia",
  },
} as const;

export function ClausulaCard({
  clausula,
  index,
  isActive,
  onSelect,
}: ClausulaCardProps) {
  const styles = stylesByTipo[clausula.tipo];

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className={`w-full rounded-corp border p-5 text-left transition-colors ${styles.container} ${
        isActive ? "ring-2 ring-slate-300" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={styles.dot} aria-hidden />
          <span
            className={`rounded-corp border px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
          >
            {styles.label}
          </span>
        </div>
        <span className="text-xs text-corp-muted">
          Cláusula {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <blockquote className="mb-3 border-l-2 border-slate-300 pl-3 text-sm italic leading-relaxed text-slate-700">
        &ldquo;{clausula.texto_original}&rdquo;
      </blockquote>

      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium text-corp-muted">Motivo: </span>
          <span className="text-slate-700">{clausula.motivo}</span>
        </p>
        <p>
          <span className="font-medium text-corp-muted">Sugerencia: </span>
          <span className="text-slate-700">{clausula.sugerencia}</span>
        </p>
      </div>
    </button>
  );
}
