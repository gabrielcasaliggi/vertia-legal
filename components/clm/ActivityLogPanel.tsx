"use client";

import { useEffect, useState } from "react";
import {
  activityActionLabel,
  type ActivityLogEntry,
} from "@/lib/contracts/activity-log-types";

export function ActivityLogPanel() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const response = await fetch("/api/activity");
      const payload = await response.json();
      if (response.ok) {
        setEntries(payload.entries ?? []);
      }
      setIsLoading(false);
    }

    void load();
  }, []);

  return (
    <section className="corp-panel ops-panel-accent p-5">
      <p className="corp-label text-cyan-700">Bitácora de actividad</p>
      <p className="mt-1 text-sm text-corp-muted">
        Trazabilidad de cargas, auditorías, exportes y tareas.
      </p>

      <div className="mt-4 max-h-[240px] space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-sm text-corp-muted">Cargando actividad...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-corp-muted">Sin actividad registrada aún.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-corp border border-corp-border bg-white/70 px-3 py-2.5 text-sm"
            >
              <p className="font-medium text-corp-text">
                {activityActionLabel(entry.action)}
              </p>
              {entry.entity_label && (
                <p className="mt-0.5 text-corp-muted">{entry.entity_label}</p>
              )}
              <p className="mt-1 text-xs text-corp-muted">
                {entry.actor_name} ·{" "}
                {new Date(entry.created_at).toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
