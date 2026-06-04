export type RiskLevel = "ALTO" | "MEDIO" | "BAJO";
export type ComparisonRiskLevel = "alto" | "medio" | "bajo";

export function riesgoBadgeClass(riesgo: RiskLevel): string {
  if (riesgo === "ALTO") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (riesgo === "MEDIO") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

export function comparisonRiskClass(level: ComparisonRiskLevel): string {
  if (level === "alto") {
    return "border-red-200 bg-red-50 text-red-900";
  }
  if (level === "medio") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}
