"use client";

import { useCallback, useEffect, useState } from "react";
import { ContractDropzone } from "@/components/hud/ContractDropzone";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
} from "@/lib/contracts/document-categories";

export interface ContractUploadMetadata {
  client_name: string;
  folder_name: string;
  contract_type: string;
  document_category: DocumentCategory | "";
}

interface ContractUploadFormProps {
  defaultClient?: string | null;
  defaultFolder?: string | null;
  disabled?: boolean;
  onUpload: (file: File, metadata: ContractUploadMetadata) => void;
}

export function ContractUploadForm({
  defaultClient,
  defaultFolder,
  disabled = false,
  onUpload,
}: ContractUploadFormProps) {
  const [clientName, setClientName] = useState(defaultClient ?? "General");
  const [folderName, setFolderName] = useState(defaultFolder ?? "Expedientes");
  const [contractType, setContractType] = useState("");
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory | "">("");

  useEffect(() => {
    if (defaultClient) {
      setClientName(defaultClient);
    }
  }, [defaultClient]);

  useEffect(() => {
    if (defaultFolder) {
      setFolderName(defaultFolder);
    }
  }, [defaultFolder]);

  const handleFileAccepted = useCallback(
    (file: File) => {
      onUpload(file, {
        client_name: clientName.trim() || "General",
        folder_name: folderName.trim() || "Expedientes",
        contract_type: contractType.trim(),
        document_category: documentCategory,
      });
    },
    [clientName, contractType, documentCategory, folderName, onUpload],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Cliente</span>
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            className="corp-input w-full"
            disabled={disabled}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Carpeta</span>
          <input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            className="corp-input w-full"
            disabled={disabled}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Tipo de contrato</span>
          <input
            value={contractType}
            onChange={(event) => setContractType(event.target.value)}
            placeholder="Opcional"
            className="corp-input w-full"
            disabled={disabled}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-corp-muted">Categoría documental</span>
          <select
            value={documentCategory}
            onChange={(event) =>
              setDocumentCategory(event.target.value as DocumentCategory | "")
            }
            className="corp-input w-full"
            disabled={disabled}
          >
            <option value="">Sin clasificar</option>
            {DOCUMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {DOCUMENT_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ContractDropzone onFileAccepted={handleFileAccepted} disabled={disabled} />
    </div>
  );
}
