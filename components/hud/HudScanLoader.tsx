"use client";

import { useEffect, useState } from "react";

const INDEXING_STEPS = [
  "Calculando hash SHA-256 del documento...",
  "Extrayendo texto contractual en el servidor...",
  "Registrando expediente en la base de datos...",
];

interface HudScanLoaderProps {
  fileName?: string;
}

export function HudScanLoader({ fileName }: HudScanLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStepIndex((previous) => (previous + 1) % INDEXING_STEPS.length);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="corp-panel flex min-h-[360px] flex-col items-center justify-center p-10">
      <p className="corp-label">Indexación documental en curso</p>
      <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-corp-muted">
        {INDEXING_STEPS[stepIndex]}
      </p>
      {fileName && (
        <p className="mt-4 text-sm font-medium text-corp-text">{fileName}</p>
      )}

      <div className="mt-8 flex gap-2">
        {INDEXING_STEPS.map((step, index) => (
          <span
            key={step}
            className={`h-1.5 w-12 rounded-corp transition-colors ${
              index === stepIndex
                ? "bg-slate-600"
                : index < stepIndex
                  ? "bg-slate-400"
                  : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
