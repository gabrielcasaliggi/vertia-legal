"use client";

import Link from "next/link";
import type { AssistedQueryResult } from "@/lib/contracts/assisted-query";

interface AssistedQueryBubbleProps {
  result: AssistedQueryResult;
  contractId: string | null;
  onCreateTask?: (title: string, description: string) => void;
  taskCreating?: boolean;
  taskCreated?: boolean;
  /** Ocultar enlace a revisión IA cuando ya está en detalle del expediente */
  hideAuditLink?: boolean;
}

const MODE_LABELS: Record<AssistedQueryResult["modo"], string> = {
  document_query: "Consulta documental",
  legal_doubt: "Validar duda",
  risk_review: "Revisión de riesgos",
};

export function AssistedQueryBubble({
  result,
  contractId,
  onCreateTask,
  taskCreating = false,
  taskCreated = false,
  hideAuditLink = false,
}: AssistedQueryBubbleProps) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">
          {MODE_LABELS[result.modo]}
        </span>
        {result.contexto_insuficiente && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            Sin evidencia suficiente en el texto indexado
          </span>
        )}
      </div>

      {result.respuesta_breve ? (
        <p className="font-medium text-corp-text">{result.respuesta_breve}</p>
      ) : null}

      {result.fundamento ? (
        <div>
          <p className="corp-label mb-1">Fundamento</p>
          <p className="whitespace-pre-wrap">{result.fundamento}</p>
        </div>
      ) : null}

      {result.evidencia.length > 0 ? (
        <div>
          <p className="corp-label mb-1.5">Evidencia en el documento</p>
          <ul className="space-y-2">
            {result.evidencia.map((item, index) => (
              <li
                key={`ev-${index}`}
                className="rounded-corp border border-corp-border bg-white/80 px-3 py-2"
              >
                <p className="italic text-corp-text">&ldquo;{item.texto}&rdquo;</p>
                {item.seccion ? (
                  <p className="mt-1 text-xs text-corp-muted">{item.seccion}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-corp-muted">
          No se encontraron citas textuales en el fragmento analizado.
        </p>
      )}

      {result.riesgos_o_advertencias.length > 0 ? (
        <div>
          <p className="corp-label mb-1">Riesgos o advertencias</p>
          <ul className="list-disc space-y-1 pl-5">
            {result.riesgos_o_advertencias.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.que_revisar.length > 0 ? (
        <div>
          <p className="corp-label mb-1">Qué revisar</p>
          <ul className="list-disc space-y-1 pl-5">
            {result.que_revisar.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.accion_sugerida ? (
        <p className="rounded-corp border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-corp-text">
          <span className="font-semibold text-emerald-900">Acción sugerida: </span>
          {result.accion_sugerida}
        </p>
      ) : null}

      <p className="text-xs text-corp-muted">{result.disclaimer}</p>

      <div className="flex flex-wrap gap-2 pt-1">
        {onCreateTask && result.accion_sugerida ? (
          <button
            type="button"
            disabled={taskCreating || taskCreated || !contractId}
            onClick={() =>
              onCreateTask(
                result.accion_sugerida.slice(0, 120),
                [
                  result.respuesta_breve,
                  result.fundamento,
                  ...result.que_revisar.map((line) => `• ${line}`),
                ]
                  .filter(Boolean)
                  .join("\n"),
              )
            }
            className="corp-btn text-xs"
          >
            {taskCreated ? "Tarea creada" : taskCreating ? "Creando..." : "Crear tarea"}
          </button>
        ) : null}
        {contractId && !hideAuditLink ? (
          <Link href={`/contracts/${contractId}`} className="corp-btn text-xs">
            Abrir documento
          </Link>
        ) : null}
        {contractId && !hideAuditLink ? (
          <Link
            href={`/contracts/${contractId}#auditoria-cognitiva`}
            className="corp-btn-primary text-xs"
          >
            Revisión IA completa
          </Link>
        ) : null}
        {hideAuditLink ? (
          <a href="#auditoria-cognitiva" className="corp-btn-primary text-xs">
            Ir a auditoría cognitiva
          </a>
        ) : null}
      </div>
    </div>
  );
}
