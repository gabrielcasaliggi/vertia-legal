"use client";

import { useEffect, useState } from "react";
import type { LegalContract } from "@/lib/supabase/types";

interface ContractRenewalPanelProps {
  contract: LegalContract;
  onUpdated: (contract: LegalContract) => void;
}

export function ContractRenewalPanel({
  contract,
  onUpdated,
}: ContractRenewalPanelProps) {
  const [autoRenewal, setAutoRenewal] = useState(contract.auto_renewal);
  const [noticeDays, setNoticeDays] = useState(
    contract.renewal_notice_days?.toString() ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAutoRenewal(contract.auto_renewal);
    setNoticeDays(contract.renewal_notice_days?.toString() ?? "");
  }, [contract]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_renewal: autoRenewal,
          renewal_notice_days: noticeDays.trim()
            ? Number.parseInt(noticeDays, 10)
            : null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al guardar.");
      }

      onUpdated(payload.contract as LegalContract);
      setMessage("Configuración de renovación actualizada.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="corp-panel p-6">
      <p className="corp-label mb-4">Renovación contractual</p>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={autoRenewal}
          onChange={(event) => setAutoRenewal(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="font-medium text-corp-text">Renovación automática</span>
          <span className="mt-1 block text-corp-muted">
            El contrato se renueva salvo aviso previo dentro del plazo indicado.
          </span>
        </span>
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1.5 block text-corp-muted">
          Días de aviso previo para no renovar
        </span>
        <input
          type="number"
          min={1}
          max={365}
          value={noticeDays}
          onChange={(event) => setNoticeDays(event.target.value)}
          placeholder="Ej. 30"
          className="corp-input w-full max-w-xs"
          disabled={!autoRenewal}
        />
      </label>

      {message && (
        <p className="mt-4 rounded-corp border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-corp border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="corp-btn mt-5"
      >
        {isSaving ? "Guardando..." : "Guardar renovación"}
      </button>
    </div>
  );
}
