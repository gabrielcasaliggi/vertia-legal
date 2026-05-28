"use client";

import { useEffect, useState } from "react";
import type { LegalContract } from "@/lib/supabase/types";

interface ContractMetadataEditorProps {
  contract: LegalContract;
  onUpdated: (contract: LegalContract) => void;
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export function ContractMetadataEditor({
  contract,
  onUpdated,
}: ContractMetadataEditorProps) {
  const [clientName, setClientName] = useState(contract.client_name);
  const [folderName, setFolderName] = useState(contract.folder_name);
  const [contractType, setContractType] = useState(contract.contract_type ?? "");
  const [partyA, setPartyA] = useState(contract.party_a ?? "");
  const [partyB, setPartyB] = useState(contract.party_b ?? "");
  const [startsAt, setStartsAt] = useState(toDateInputValue(contract.starts_at));
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(contract.expires_at));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientName(contract.client_name);
    setFolderName(contract.folder_name);
    setContractType(contract.contract_type ?? "");
    setPartyA(contract.party_a ?? "");
    setPartyB(contract.party_b ?? "");
    setStartsAt(toDateInputValue(contract.starts_at));
    setExpiresAt(toDateInputValue(contract.expires_at));
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
          client_name: clientName,
          folder_name: folderName,
          contract_type: contractType || null,
          party_a: partyA || null,
          party_b: partyB || null,
          starts_at: startsAt || null,
          expires_at: expiresAt || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al guardar.");
      }

      onUpdated(payload.contract as LegalContract);
      setMessage("Metadatos actualizados correctamente.");
    } catch (saveError) {
      const saveMessage =
        saveError instanceof Error ? saveError.message : "No se pudo guardar.";
      setError(saveMessage);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="corp-panel p-6">
      <p className="corp-label mb-4">Gestión del expediente</p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Cliente</span>
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            className="corp-input w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Carpeta</span>
          <input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            className="corp-input w-full"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-1.5 block text-corp-muted">Tipo de contrato</span>
          <input
            value={contractType}
            onChange={(event) => setContractType(event.target.value)}
            placeholder="Ej. Locación, Servicios, Confidencialidad..."
            className="corp-input w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Parte A</span>
          <input
            value={partyA}
            onChange={(event) => setPartyA(event.target.value)}
            className="corp-input w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Parte B</span>
          <input
            value={partyB}
            onChange={(event) => setPartyB(event.target.value)}
            className="corp-input w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Inicio de vigencia</span>
          <input
            type="date"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="corp-input w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Fin de vigencia</span>
          <input
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="corp-input w-full"
          />
        </label>
      </div>

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
        className="corp-btn-primary mt-5"
      >
        {isSaving ? "Guardando..." : "Guardar metadatos"}
      </button>
    </div>
  );
}
