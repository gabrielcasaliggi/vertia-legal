"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  formatObligationDueLabel,
  OBLIGATION_STATUS_LABELS,
  OBLIGATION_TYPE_LABELS,
  obligationStatusBadgeClass,
  type ObligationListItem,
  type ObligationType,
} from "@/lib/contracts/obligations";

interface ContractObligationsPanelProps {
  contractId: string;
}

export function ContractObligationsPanel({ contractId }: ContractObligationsPanelProps) {
  const [obligations, setObligations] = useState<ObligationListItem[]>([]);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [obligationType, setObligationType] = useState<ObligationType>("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadObligations = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(
      `/api/contracts/obligations?contract_id=${encodeURIComponent(contractId)}`,
    );
    const payload = await response.json();
    if (response.ok) {
      setObligations(payload.obligations ?? []);
    }
    setIsLoading(false);
  }, [contractId]);

  useEffect(() => {
    void loadObligations();
  }, [loadObligations]);

  async function handleCreate() {
    if (!title.trim()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/contracts/obligations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_id: contractId,
          title: title.trim(),
          due_at: dueAt || null,
          obligation_type: obligationType,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al crear obligación.");
      }

      setTitle("");
      setDueAt("");
      setObligationType("general");
      await loadObligations();
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "No se pudo crear la obligación.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(obligationId: string, status: "completed" | "pending") {
    await fetch(`/api/contracts/obligations/${obligationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadObligations();
  }

  async function handleDelete(obligationId: string) {
    if (!window.confirm("¿Eliminar esta obligación?")) {
      return;
    }

    await fetch(`/api/contracts/obligations/${obligationId}`, { method: "DELETE" });
    await loadObligations();
  }

  return (
    <div className="corp-panel p-6">
      <p className="corp-label mb-2">Obligaciones contractuales</p>
      <p className="mb-5 text-sm text-corp-muted">
        Seguimiento de pagos, avisos, renovaciones y cumplimientos vinculados al expediente.
      </p>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Descripción de la obligación..."
          className="corp-input"
        />
        <input
          type="date"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
          className="corp-input"
        />
        <select
          value={obligationType}
          onChange={(event) => setObligationType(event.target.value as ObligationType)}
          className="corp-input"
        >
          {(Object.keys(OBLIGATION_TYPE_LABELS) as ObligationType[]).map((type) => (
            <option key={type} value={type}>
              {OBLIGATION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => void handleCreate()}
        disabled={isSaving || !title.trim()}
        className="corp-btn-primary mt-3"
      >
        {isSaving ? "Agregando..." : "Agregar obligación"}
      </button>

      {error && (
        <p className="mt-3 rounded-corp border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <p className="text-sm text-corp-muted">Cargando obligaciones...</p>
        ) : obligations.length === 0 ? (
          <p className="text-sm text-corp-muted">
            Sin obligaciones registradas. Se generan automáticamente tras la auditoría cognitiva
            o pueden agregarse manualmente.
          </p>
        ) : (
          obligations.map((obligation) => (
            <div
              key={obligation.id}
              className="rounded-corp border border-corp-border bg-corp-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-corp-text">{obligation.title}</p>
                  <p className="mt-1 text-sm text-corp-muted">
                    {OBLIGATION_TYPE_LABELS[obligation.obligation_type]} ·{" "}
                    {obligation.source === "manual" ? "Manual" : "Extraída por IA"}
                  </p>
                  <p className="mt-2 text-sm font-medium text-corp-text">
                    {formatObligationDueLabel(obligation.due_at)}
                  </p>
                </div>
                <span
                  className={`rounded-corp border px-2.5 py-1 text-xs font-medium ${obligationStatusBadgeClass(obligation.status)}`}
                >
                  {OBLIGATION_STATUS_LABELS[obligation.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {obligation.status !== "completed" ? (
                  <button
                    type="button"
                    onClick={() => void handleStatusChange(obligation.id, "completed")}
                    className="corp-btn text-xs"
                  >
                    Marcar cumplida
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleStatusChange(obligation.id, "pending")}
                    className="corp-btn text-xs"
                  >
                    Reabrir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(obligation.id)}
                  className="corp-btn text-xs text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ObligationsSidebarPanel({
  obligations,
  selectedContractId,
}: {
  obligations: ObligationListItem[];
  selectedContractId?: string | null;
}) {
  const visible = selectedContractId
    ? obligations.filter((item) => item.contract_id === selectedContractId)
    : obligations.slice(0, 8);

  return (
    <div className="corp-panel flex min-h-0 flex-col p-6">
      <p className="corp-label">Próximas obligaciones</p>
      <p className="mt-2 text-sm text-corp-muted">
        {selectedContractId
          ? "Obligaciones del expediente seleccionado"
          : "Horizonte de seguimiento: 90 días"}
      </p>

      <div className="mt-5 max-h-[260px] space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="text-sm text-corp-muted">
            Sin obligaciones pendientes en el horizonte actual.
          </p>
        ) : (
          visible.map((obligation) => (
            <div
              key={obligation.id}
              className="rounded-corp border border-corp-border bg-corp-surface p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`${obligation.status === "overdue" ? "status-dot-terracotta" : obligation.status === "pending" ? "status-dot-amber" : "status-dot-emerald"} mt-1.5`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/contracts/${obligation.contract_id}`}
                    className="font-medium text-corp-text hover:underline"
                  >
                    {obligation.file_name}
                  </Link>
                  <p className="mt-1 text-sm text-corp-muted">{obligation.title}</p>
                  <p className="mt-2 text-sm font-medium text-corp-text">
                    {formatObligationDueLabel(obligation.due_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
