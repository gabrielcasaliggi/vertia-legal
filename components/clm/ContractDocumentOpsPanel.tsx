"use client";

import { useCallback, useEffect, useState } from "react";

interface VersionRow {
  id: string;
  version_number: number;
  file_name: string;
  file_hash: string;
  uploaded_by_name: string | null;
  created_at: string;
}

interface ContractDocumentOpsPanelProps {
  contractId: string;
  onUpdated?: () => void;
}

export function ContractDocumentOpsPanel({
  contractId,
  onUpdated,
}: ContractDocumentOpsPanelProps) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/versions`);
      const payload = await response.json();
      if (response.ok) {
        setVersions(payload.versions ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  async function handleReindex() {
    setIsReindexing(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}/reindex`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al reindexar.");
      }
      setMessage(`Texto reindexado (${payload.extractedLength} caracteres).`);
      onUpdated?.();
    } catch (reindexError) {
      setError(
        reindexError instanceof Error ? reindexError.message : "Error al reindexar.",
      );
    } finally {
      setIsReindexing(false);
    }
  }

  async function handleReplace(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setIsReplacing(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/contracts/${contractId}/replace`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al reemplazar.");
      }
      setMessage(`Nueva versión v${payload.version_number} cargada.`);
      await loadVersions();
      onUpdated?.();
    } catch (replaceError) {
      setError(
        replaceError instanceof Error ? replaceError.message : "Error al reemplazar.",
      );
    } finally {
      setIsReplacing(false);
      event.target.value = "";
    }
  }

  return (
    <div className="corp-panel p-6">
      <p className="corp-label mb-3">Operaciones documentales</p>
      <p className="mb-4 text-sm text-corp-muted">
        Reindexá el texto del PDF actual o subí una nueva versión manteniendo historial.
      </p>
      <div className="mb-4 rounded-corp border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Antes de reemplazar un PDF</p>
        <p className="mt-1 text-xs leading-relaxed">
          La indexación requiere texto copiable. Si el documento nuevo es escaneado,
          aplicá OCR previamente y subí el PDF resultante con capa de texto.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleReindex()}
          disabled={isReindexing}
          className="corp-btn"
        >
          {isReindexing ? "Reindexando..." : "Reindexar texto"}
        </button>
        <label className="corp-btn-primary cursor-pointer">
          {isReplacing ? "Subiendo..." : "Reemplazar PDF"}
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            disabled={isReplacing}
            onChange={(event) => void handleReplace(event)}
          />
        </label>
      </div>

      {message ? (
        <p className="mt-3 rounded-corp border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-corp border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <p className="corp-label mb-2">Versiones</p>
        {isLoading ? (
          <p className="text-sm text-corp-muted">Cargando versiones...</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-corp-muted">Sin versiones registradas.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version) => (
              <li
                key={version.id}
                className="rounded-corp border border-corp-border bg-white/70 px-3 py-2 text-sm"
              >
                <span className="font-medium text-corp-text">
                  v{version.version_number} — {version.file_name}
                </span>
                <p className="mt-1 text-xs text-corp-muted">
                  {version.uploaded_by_name ?? "Sistema"} ·{" "}
                  {new Date(version.created_at).toLocaleString("es-AR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
