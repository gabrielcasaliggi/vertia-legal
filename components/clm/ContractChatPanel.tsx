"use client";

import { useMemo, useState } from "react";
import { AssistedQueryBubble } from "@/components/clm/AssistedQueryBubble";
import { isChatContextReady } from "@/lib/clm/search-signals";
import type { AssistedQueryMode, AssistedQueryResult } from "@/lib/contracts/assisted-query";
import type { ContractSearchMatch } from "@/lib/supabase/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  structured?: AssistedQueryResult;
}

interface ContractChatPanelProps {
  contractId: string;
  contractFileName: string;
  matches?: ContractSearchMatch[];
  selectedMatch?: ContractSearchMatch | null;
  /** false si el PDF aún no tiene texto indexado */
  canQuery?: boolean;
  variant?: "hub" | "detail";
  onQueryComplete?: () => void;
  onGoToAudit?: () => void;
}

type QuickPrompt = {
  label: string;
  mode: AssistedQueryMode;
  message: string;
};

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Obligaciones y plazos",
    mode: "document_query",
    message: "¿Cuáles son las obligaciones principales y sus plazos según el documento?",
  },
  {
    label: "Vencimiento y rescisión",
    mode: "document_query",
    message: "¿Cuándo vence el contrato y qué condiciones de rescisión o renovación aparecen?",
  },
  {
    label: "Validar una duda",
    mode: "legal_doubt",
    message:
      "Quiero validar esta duda: ¿es razonable aceptar la cláusula de penalidades tal como está redactada?",
  },
  {
    label: "Riesgos sensibles",
    mode: "risk_review",
    message:
      "Identificá las cláusulas más sensibles (penalidades, confidencialidad, responsabilidad, arbitraje) y el nivel de riesgo.",
  },
];

const MODE_OPTIONS: Array<{ id: AssistedQueryMode; label: string; hint: string }> = [
  {
    id: "document_query",
    label: "Consulta",
    hint: "Hechos y cláusulas del documento",
  },
  {
    id: "legal_doubt",
    label: "Validar duda",
    hint: "Razonabilidad y qué revisar antes de decidir",
  },
  {
    id: "risk_review",
    label: "Riesgos",
    hint: "Cláusulas sensibles y alertas",
  },
];

export function ContractChatPanel({
  contractId,
  contractFileName,
  matches = [],
  selectedMatch = null,
  canQuery = true,
  variant = "hub",
  onQueryComplete,
  onGoToAudit,
}: ContractChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Consulta asistida sobre el expediente seleccionado. Elegí un modo, una plantilla o escribí tu pregunta. Las respuestas citan el texto indexado cuando hay evidencia; no sustituyen el dictamen del estudio.",
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AssistedQueryMode>("document_query");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskCreating, setTaskCreating] = useState(false);
  const [lastTaskCreated, setLastTaskCreated] = useState(false);

  const contextReady = useMemo(
    () => canQuery && Boolean(contractId) && (variant === "detail" || isChatContextReady(matches, contractId)),
    [canQuery, contractId, variant, matches],
  );

  const canSend = contextReady && input.trim().length > 0 && !isSending;

  async function sendMessage(message: string, queryMode: AssistedQueryMode) {
    if (!contextReady || !contractId || isSending) {
      return;
    }

    const nextHistory = [...messages, { role: "user" as const, content: message }];
    setMessages(nextHistory);
    setInput("");
    setIsSending(true);
    setError(null);
    setLastTaskCreated(false);

    try {
      const response = await fetch("/api/contracts/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          mode: queryMode,
          historial: messages
            .slice(1)
            .slice(-6)
            .map(({ role, content }) => ({ role, content })),
          contract_id: contractId,
          contract_name: selectedMatch?.archivo ?? contractFileName,
          matches: matches.length > 0 ? matches : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error en la consulta.");
      }

      setMessages([
        ...nextHistory,
        {
          role: "assistant",
          content: payload.respuesta,
          structured: payload.structured,
        },
      ]);
      onQueryComplete?.();
    } catch (chatError) {
      const chatMessage =
        chatError instanceof Error ? chatError.message : "No se pudo enviar el mensaje.";
      setError(chatMessage);
      setMessages(nextHistory);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSend() {
    const message = input.trim();
    if (!canSend) {
      return;
    }
    await sendMessage(message, mode);
  }

  function applyQuickPrompt(prompt: QuickPrompt) {
    setMode(prompt.mode);
    setInput(prompt.message);
  }

  async function handleCreateTask(title: string, description: string) {
    if (!contractId || taskCreating) {
      return;
    }
    setTaskCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          contract_id: contractId,
          priority: "normal",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "No se pudo crear la tarea.");
      }
      setLastTaskCreated(true);
    } catch (taskError) {
      setError(
        taskError instanceof Error ? taskError.message : "Error al crear la tarea.",
      );
    } finally {
      setTaskCreating(false);
    }
  }

  function exportLastAnswer() {
    const lastAssistant = [...messages].reverse().find((item) => item.role === "assistant");
    if (!lastAssistant) {
      return;
    }
    const blob = new Blob([lastAssistant.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `consulta-ia-${selectedMatch?.archivo ?? contractFileName ?? "expediente"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const hasStructuredReply = messages.some((item) => item.structured);

  return (
    <div className="corp-panel flex min-h-[360px] flex-col">
      <div className="border-b border-corp-border px-6 py-5">
        <p className="corp-label">Consulta asistida (IA bajo demanda)</p>
        <p className="mt-2 text-sm text-corp-muted">
          {variant === "detail"
            ? "Consultá sobre este expediente. La auditoría cognitiva con score de riesgo está más abajo."
            : "Asistente vinculado al expediente de la búsqueda. Para auditoría completa, abrí el documento."}
        </p>
      </div>

      <div
        className={`border-b px-6 py-4 ${
          contextReady ? "bg-emerald-50/60" : "bg-corp-surface/50"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-1.5 ${contextReady ? "status-dot-emerald" : "status-dot-neutral"}`}
            aria-hidden
          />
          <div>
            <p className="corp-label">Expediente activo</p>
            <p className="mt-1.5 text-sm text-corp-text">
              {contextReady
                ? variant === "detail"
                  ? contractFileName
                  : selectedMatch
                    ? `${selectedMatch.archivo} · Riesgo ${selectedMatch.riesgo}`
                    : contractFileName
                : variant === "detail"
                  ? "El documento debe estar indexado para consultar con IA."
                  : "Seleccione un resultado de búsqueda para habilitar la consulta."}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-corp-border px-6 py-4">
        <p className="corp-label mb-2">Modo de consulta</p>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={!contextReady}
              onClick={() => setMode(option.id)}
              className={`rounded-corp border px-3 py-2 text-left text-xs transition ${
                mode === option.id
                  ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                  : "border-corp-border bg-white text-corp-muted hover:border-cyan-200"
              }`}
              title={option.hint}
            >
              <span className="font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-[11px] opacity-80">{option.hint}</span>
            </button>
          ))}
        </div>
        <p className="corp-label mb-2 mt-4">Preguntas frecuentes</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              disabled={!contextReady || isSending}
              onClick={() => applyQuickPrompt(prompt)}
              className="rounded-full border border-corp-border bg-corp-surface px-3 py-1.5 text-xs text-corp-text hover:border-cyan-300 disabled:opacity-50"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-corp border px-4 py-3 text-sm ${
              message.role === "assistant"
                ? "border-corp-border bg-corp-surface text-slate-700"
                : "border-slate-300 bg-corp-panel text-corp-text"
            }`}
          >
            <p className="mb-1 text-xs font-semibold text-corp-muted">
              {message.role === "assistant" ? "Asistente" : "Usuario"}
            </p>
            {message.role === "assistant" && message.structured ? (
              <AssistedQueryBubble
                result={message.structured}
                contractId={contractId}
                onCreateTask={handleCreateTask}
                taskCreating={taskCreating}
                taskCreated={lastTaskCreated}
                onGoToAudit={variant === "detail" ? onGoToAudit : undefined}
              />
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-corp-border p-6">
        {error && (
          <p className="mb-3 rounded-corp border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {hasStructuredReply && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={exportLastAnswer}
              className="corp-btn text-xs"
            >
              Exportar última respuesta
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSend) {
                void handleSend();
              }
            }}
            placeholder={
              contextReady
                ? "Escriba su consulta sobre el documento..."
                : variant === "detail"
                  ? "Espere a que termine la indexación del PDF..."
                  : "Seleccione un expediente en los resultados..."
            }
            className="corp-input flex-1"
            disabled={isSending || !contextReady}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className={canSend ? "corp-btn-primary" : "corp-btn opacity-60"}
          >
            {isSending ? "Analizando..." : "Consultar"}
          </button>
        </div>
      </div>
    </div>
  );
}
