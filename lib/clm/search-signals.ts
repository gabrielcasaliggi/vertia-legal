import type { ContractSearchMatch } from "@/lib/contracts/search-intelligence";
import { riesgoToScore } from "@/lib/contracts/search-intelligence";
import type { SemaphoreLevel } from "@/components/hud/SemaphoreHeatmapCard";

export interface SearchHeatmap {
  score: number;
  riesgo: "BAJO" | "MEDIO" | "ALTO";
  coincidencias: number;
}

export function resolveSelectedMatch(
  matches: ContractSearchMatch[],
  selectedMatchId: string | null,
): ContractSearchMatch | null {
  if (matches.length === 0) {
    return null;
  }
  if (selectedMatchId) {
    return matches.find((match) => match.id === selectedMatchId) ?? matches[0];
  }
  return matches[0];
}

export function riesgoToSemaphoreLevel(riesgo: ContractSearchMatch["riesgo"]): SemaphoreLevel {
  if (riesgo === "ALTO") {
    return "high";
  }
  if (riesgo === "MEDIO") {
    return "moderate";
  }
  return "low";
}

export function diasToSemaphoreLevel(dias: number | null): SemaphoreLevel {
  if (dias === null) {
    return "idle";
  }
  if (dias <= 7) {
    return "critical";
  }
  if (dias <= 15) {
    return "high";
  }
  if (dias <= 30) {
    return "moderate";
  }
  return "low";
}

export function resolveHeatmapSignal(
  searchHeatmap: SearchHeatmap | null,
  selectedMatch: ContractSearchMatch | null,
): { level: SemaphoreLevel; score: number | undefined; subtitle: string } {
  if (selectedMatch) {
    return {
      level: riesgoToSemaphoreLevel(selectedMatch.riesgo),
      score: riesgoToScore(selectedMatch.riesgo),
      subtitle: `${selectedMatch.archivo} — riesgo ${selectedMatch.riesgo}`,
    };
  }

  if (searchHeatmap && searchHeatmap.coincidencias > 0) {
    return {
      level: riesgoToSemaphoreLevel(searchHeatmap.riesgo),
      score: searchHeatmap.score,
      subtitle: `${searchHeatmap.coincidencias} coincidencias — riesgo ${searchHeatmap.riesgo}`,
    };
  }

  return {
    level: "idle",
    score: undefined,
    subtitle: "Heatmap de riesgo contractual",
  };
}

export function resolveVentanaSignal(
  selectedMatch: ContractSearchMatch | null,
  searchMatches: ContractSearchMatch[],
): {
  level: SemaphoreLevel;
  score: number | undefined;
  subtitle: string;
  dias: number | null;
  archivo: string | null;
} {
  const match = selectedMatch ?? searchMatches[0] ?? null;

  if (!match) {
    return {
      level: "idle",
      score: undefined,
      subtitle: "Panel centinela de vencimientos",
      dias: null,
      archivo: null,
    };
  }

  return {
    level: diasToSemaphoreLevel(match.dias_criticos),
    score: match.dias_criticos ?? undefined,
    subtitle: `Ventana crítica — ${match.dias_criticos ?? "n/d"} días`,
    dias: match.dias_criticos,
    archivo: match.archivo,
  };
}

export function isChatContextReady(
  _matches: ContractSearchMatch[],
  activeContractId: string | null,
): boolean {
  return Boolean(activeContractId);
}
