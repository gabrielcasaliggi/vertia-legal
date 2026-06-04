"use client";

import Link from "next/link";
import { ContractSummaryCard } from "@/components/clm/ContractSummaryCard";
import { riesgoBadgeClass } from "@/lib/contracts/risk-badges";
import {
  formatExpiryLabel,
  LIFECYCLE_LABELS,
  lifecycleBadgeClass,
} from "@/lib/contracts/lifecycle";
import type { ContractSearchMatch } from "@/lib/supabase/types";

interface SearchResultCardProps {
  match: ContractSearchMatch;
  selected: boolean;
  onSelect: () => void;
}

function renderHighlightedSnippet(snippet: string) {
  const parts = snippet.split(/(【[^】]+】)/g);

  return parts.map((part, index) => {
    if (part.startsWith("【") && part.endsWith("】")) {
      const term = part.slice(1, -1);
      return (
        <mark key={`${term}-${index}`} className="corp-highlight font-medium">
          {term}
        </mark>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

export function SearchResultCard({
  match,
  selected,
  onSelect,
}: SearchResultCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-corp border transition-colors ${
        selected
          ? "border-slate-400 bg-corp-panel shadow-corp-md ring-1 ring-slate-200"
          : "border-corp-border bg-corp-panel hover:border-slate-300 hover:shadow-corp"
      }`}
    >
      <div className="absolute left-0 top-0 h-full w-2 bg-slate-300" />

      <header className="border-b border-corp-border bg-corp-surface/50 px-6 py-5 pl-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="corp-label mb-1.5">Expediente contractual</p>
            <p className="truncate text-base font-semibold text-corp-text">
              {match.archivo}
            </p>
            <p className="mt-1.5 text-sm text-corp-muted">
              {match.client_name} · {match.folder_name}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span
              className={`rounded-corp border px-3 py-1 text-xs font-medium ${lifecycleBadgeClass(match.lifecycle_status)}`}
            >
              {LIFECYCLE_LABELS[match.lifecycle_status]}
            </span>
            <span
              className={`rounded-corp border px-3 py-1 text-xs font-medium ${riesgoBadgeClass(match.riesgo)}`}
            >
              Riesgo {match.riesgo}
            </span>
            <span className="rounded-corp border border-corp-border bg-corp-panel px-3 py-1 text-xs font-medium text-corp-muted">
              {match.expires_at
                ? formatExpiryLabel(match.expires_at)
                : `${match.dias_criticos ?? "n/d"} días`}
            </span>
          </div>
        </div>
      </header>

      <div className="border-t border-corp-border px-6 py-4 pl-8">
        <ContractSummaryCard contract={match} compact />
      </div>

      <div className="px-6 py-5 pl-8">
        <p className="corp-label mb-2">Extracto indexado</p>
        <blockquote className="rounded-corp border border-corp-border bg-corp-bg px-5 py-4 text-sm leading-relaxed text-slate-700">
          {renderHighlightedSnippet(match.snippet)}
        </blockquote>
      </div>

      <footer className="flex gap-3 border-t border-corp-border bg-corp-surface/30 px-6 py-4 pl-8">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className={selected ? "corp-btn-primary" : "corp-btn"}
        >
          {selected ? "Expediente activo" : "Seleccionar expediente"}
        </button>
        <Link
          href={`/contracts/${match.contract_id}`}
          onClick={(event) => event.stopPropagation()}
          className="corp-btn"
        >
          Abrir detalle
        </Link>
      </footer>
    </article>
  );
}
