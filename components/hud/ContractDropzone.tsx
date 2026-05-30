"use client";

import { useCallback, useState } from "react";

interface ContractDropzoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}

export function ContractDropzone({
  onFileAccepted,
  disabled = false,
}: ContractDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) {
        return;
      }

      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        return;
      }

      onFileAccepted(file);
    },
    [disabled, onFileAccepted],
  );

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFile(event.dataTransfer.files[0]);
      }}
      className={`relative rounded-corp border-2 border-dashed p-12 text-center transition-colors ${
        isDragging
          ? "border-slate-400 bg-corp-surface"
          : "border-corp-border bg-corp-panel hover:border-slate-300 hover:bg-corp-surface/50"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />

      <div className="pointer-events-none relative z-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-corp border border-corp-border bg-corp-surface">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-corp-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
        </div>
        <p className="text-base font-medium text-corp-text">
          {isDragging
            ? "Suelte el archivo PDF para indexar"
            : "Arrastre el contrato PDF o haga clic para seleccionar"}
        </p>
        <p className="mt-2 text-sm text-corp-muted">
          El documento será indexado localmente sin auditoría automática.
        </p>
        <div className="mx-auto mt-4 max-w-2xl rounded-corp border border-amber-300/60 bg-amber-50 px-4 py-3 text-left text-xs leading-relaxed text-amber-950">
          <p className="font-semibold">Importante sobre PDFs escaneados</p>
          <p className="mt-1">
            Para búsqueda e IA, subí PDFs digitales con texto copiable. Si el archivo es
            una imagen escaneada, primero aplicá OCR y luego cargá la versión con capa
            de texto.
          </p>
        </div>
      </div>
    </div>
  );
}
