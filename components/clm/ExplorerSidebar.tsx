"use client";

import Link from "next/link";
import type { ContractListItem } from "@/lib/supabase/types";

interface ExplorerSidebarProps {
  contracts: ContractListItem[];
  selectedClient: string | null;
  selectedFolder: string | null;
  onSelectClient: (client: string | null) => void;
  onSelectFolder: (folder: string | null) => void;
}

export function ExplorerSidebar({
  contracts,
  selectedClient,
  selectedFolder,
  onSelectClient,
  onSelectFolder,
}: ExplorerSidebarProps) {
  const clients = [...new Set(contracts.map((item) => item.client_name))].sort();
  const folders = [
    ...new Set(
      contracts
        .filter((item) => !selectedClient || item.client_name === selectedClient)
        .map((item) => item.folder_name),
    ),
  ].sort();

  return (
    <aside className="corp-panel flex h-full flex-col p-6">
      <p className="corp-label">Explorador documental</p>

      <button
        type="button"
        onClick={() => {
          onSelectClient(null);
          onSelectFolder(null);
        }}
        className="corp-btn mt-6 w-full text-left"
      >
        Todos los documentos
      </button>

      <div className="mt-6">
        <h3 className="corp-label mb-3">Clientes</h3>
        <div className="space-y-1">
          {clients.length === 0 ? (
            <p className="px-2 text-sm text-corp-muted">Sin clientes indexados.</p>
          ) : (
            clients.map((client) => (
              <button
                key={client}
                type="button"
                onClick={() => {
                  onSelectClient(client);
                  onSelectFolder(null);
                }}
                className={`block w-full rounded-corp px-3 py-2.5 text-left text-sm transition ${
                  selectedClient === client
                    ? "bg-corp-surface font-medium text-corp-text"
                    : "text-corp-muted hover:bg-corp-surface hover:text-corp-text"
                }`}
              >
                {client}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="corp-label mb-3">Carpetas</h3>
        <div className="space-y-1">
          {folders.length === 0 ? (
            <p className="px-2 text-sm text-corp-muted">Sin carpetas activas.</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => onSelectFolder(folder)}
                className={`block w-full rounded-corp px-3 py-2.5 text-left text-sm transition ${
                  selectedFolder === folder
                    ? "bg-corp-surface font-medium text-corp-text"
                    : "text-corp-muted hover:bg-corp-surface hover:text-corp-text"
                }`}
              >
                {folder}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 text-sm text-corp-muted">
        <Link href="/" className="transition hover:text-corp-text">
          Inicio
        </Link>
      </div>
    </aside>
  );
}
