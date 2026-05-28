"use client";

import { useCallback, useEffect, useState } from "react";
import type { NotificationDigest } from "@/lib/notifications/types";

interface DigestPreviewResponse {
  digest: NotificationDigest;
  smtp_configured: boolean;
  recipients_configured: string[];
}

interface SendResponse extends DigestPreviewResponse {
  results: Array<{
    ok: boolean;
    skipped: boolean;
    recipient: string;
    error?: string;
  }>;
}

export function NotificationDigestPanel() {
  const [preview, setPreview] = useState<DigestPreviewResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/notifications/digest");
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo cargar la vista previa.");
      setPreview(null);
    } else {
      setPreview(payload as DigestPreviewResponse);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  async function sendDigest(force: boolean) {
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/notifications/digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const payload = (await response.json()) as SendResponse & { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo enviar el resumen.");
    } else {
      const sent = payload.results?.filter((item) => item.ok && !item.skipped).length ?? 0;
      const skipped = payload.results?.filter((item) => item.skipped).length ?? 0;
      const failed = payload.results?.filter((item) => !item.ok).length ?? 0;
      setMessage(
        `Envío completado: ${sent} enviado(s), ${skipped} omitido(s), ${failed} error(es).`,
      );
      setPreview({
        digest: payload.digest,
        smtp_configured: payload.smtp_configured,
        recipients_configured: payload.recipients_configured,
      });
    }
    setLoading(false);
  }

  const digest = preview?.digest;
  const totalItems = digest
    ? digest.expirations.length + digest.tasks.length + digest.obligations.length
    : 0;

  return (
    <section className="corp-panel ops-panel-accent p-6">
      <p className="corp-label text-cyan-700">Alertas por email</p>
      <p className="mt-1 text-sm text-corp-muted">
        Resumen diario de vencimientos contractuales, tareas y obligaciones. Requiere SMTP
        configurado en el servidor.
      </p>

      {preview && !preview.smtp_configured ? (
        <p className="mt-3 rounded-corp border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          SMTP no configurado. Agregá las variables SMTP_* y NOTIFICATION_DIGEST_TO en{" "}
          <code className="text-xs">.env.local</code>.
        </p>
      ) : null}

      {message ? (
        <p className="mt-3 rounded-corp border border-corp-border bg-white/80 px-3 py-2 text-sm text-corp-text">
          {message}
        </p>
      ) : null}

      {digest ? (
        <ul className="mt-4 space-y-1 text-sm text-corp-muted">
          <li>
            <strong className="text-corp-text">{digest.expirations.length}</strong> contrato(s)
            por vencer (30 días)
          </li>
          <li>
            <strong className="text-corp-text">{digest.tasks.length}</strong> tarea(s) próxima(s)
            o vencida(s)
          </li>
          <li>
            <strong className="text-corp-text">{digest.obligations.length}</strong> obligación(es)
            pendiente(s)
          </li>
          {preview?.recipients_configured.length ? (
            <li>
              Destinatarios fijos:{" "}
              <span className="text-corp-text">
                {preview.recipients_configured.join(", ")}
              </span>
            </li>
          ) : (
            <li>Sin lista fija: se envía a todos los usuarios activos del estudio.</li>
          )}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="corp-btn"
          disabled={loading}
          onClick={() => void loadPreview()}
        >
          Actualizar vista previa
        </button>
        <button
          type="button"
          className="corp-btn-primary"
          disabled={loading || !preview?.smtp_configured || totalItems === 0}
          onClick={() => void sendDigest(false)}
        >
          Enviar resumen hoy
        </button>
        <button
          type="button"
          className="corp-btn"
          disabled={loading || !preview?.smtp_configured}
          onClick={() => void sendDigest(true)}
        >
          Reenviar (forzar)
        </button>
      </div>
    </section>
  );
}
