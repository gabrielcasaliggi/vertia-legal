"use client";

import { useCallback, useEffect, useState } from "react";

interface FileMeta {
  available: boolean;
  file_name: string;
  file_hash: string;
  size_bytes: number | null;
  reason: string | null;
}

interface ContractPdfViewerProps {
  contractId: string;
}

export function ContractPdfViewer({ contractId }: ContractPdfViewerProps) {
  const [meta, setMeta] = useState<FileMeta | null>(null);
  const [viewerKey, setViewerKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inlineUrl = `/api/contracts/${contractId}/file`;
  const downloadUrl = `/api/contracts/${contractId}/file?download=1`;

  const loadMeta = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}/file?meta=1`);
      const payload = await response.json();

      if (!response.ok) {
        setMeta(null);
        setError(payload.error ?? "No se pudo verificar el documento.");
        return;
      }

      setMeta(payload as FileMeta);
      if (!payload.available) {
        setError(
          payload.reason ??
            "El PDF no está disponible. Subí el archivo nuevamente desde Inicio.",
        );
      }
    } catch {
      setError("Error de conexión al cargar el visor.");
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  function handleRetry() {
    setViewerKey((value) => value + 1);
    void loadMeta();
  }

  if (isLoading) {
    return <p className="p-6 text-sm text-corp-muted">Verificando documento PDF…</p>;
  }

  if (error || !meta?.available) {
    return (
      <div className="rounded-corp border border-amber-200 bg-amber-50/80 p-6">
        <p className="text-sm font-medium text-amber-950">Documento no disponible para visualización</p>
        <p className="mt-2 text-sm text-amber-900/90">{error}</p>
        {meta?.file_hash ? (
          <p className="mt-3 break-all text-xs text-amber-800/80">
            Hash registrado: {meta.file_hash}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="corp-btn" onClick={handleRetry}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-corp-muted">
          {meta.file_name}
          {meta.size_bytes
            ? ` · ${(meta.size_bytes / 1024).toFixed(0)} KB`
            : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={inlineUrl} target="_blank" rel="noopener noreferrer" className="corp-btn">
            Abrir en pestaña
          </a>
          <a href={downloadUrl} className="corp-btn-primary" download={meta.file_name}>
            Descargar PDF
          </a>
          <button type="button" className="corp-btn" onClick={handleRetry}>
            Actualizar
          </button>
        </div>
      </div>

      <iframe
        key={viewerKey}
        title={`Visor PDF — ${meta.file_name}`}
        src={`${inlineUrl}#toolbar=1`}
        className="h-[65vh] w-full rounded-corp border border-corp-border bg-corp-surface"
      />
    </div>
  );
}
