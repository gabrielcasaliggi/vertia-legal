import type { NotificationDigest } from "@/lib/notifications/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function expiryLabel(days: number): string {
  if (days <= 0) {
    return "Vencido";
  }
  return `Vence en ${days} día(s)`;
}

function taskDueLabel(days: number | null): string {
  if (days === null) {
    return "Sin fecha";
  }
  if (days <= 0) {
    return "Vencida";
  }
  return `Vence en ${days} día(s)`;
}

function sectionTable(
  title: string,
  headers: string[],
  rows: string[][],
  emptyMessage: string,
): string {
  if (rows.length === 0) {
    return `
      <h2 style="margin:24px 0 8px;font-size:15px;color:#0f172a;">${title}</h2>
      <p style="margin:0;color:#64748b;font-size:13px;">${emptyMessage}</p>
    `;
  }

  const headCells = headers
    .map(
      (header) =>
        `<th style="text-align:left;padding:8px 10px;background:#f1f5f9;color:#334155;font-size:12px;">${header}</th>`,
    )
    .join("");

  const bodyRows = rows
    .map(
      (cells) =>
        `<tr>${cells
          .map(
            (cell) =>
              `<td style="padding:8px 10px;border-top:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${cell}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  return `
    <h2 style="margin:24px 0 8px;font-size:15px;color:#0f172a;">${title}</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <thead><tr>${headCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}

export function buildDigestEmailSubject(digest: NotificationDigest): string {
  const total =
    digest.expirations.length + digest.tasks.length + digest.obligations.length;
  return `[Vertia Legal] Resumen operativo — ${total} alerta(s)`;
}

export function buildDigestEmailHtml(
  digest: NotificationDigest,
  siteUrl: string,
): string {
  const expirationRows = digest.expirations.map((item) => [
    item.file_name,
    item.client_name,
    formatDate(item.expires_at),
    expiryLabel(item.days_remaining),
  ]);

  const taskRows = digest.tasks.map((item) => [
    item.title,
    item.assignee_name ?? "—",
    item.due_at ? formatDate(item.due_at) : "—",
    taskDueLabel(item.days_until_due),
    item.priority,
  ]);

  const obligationRows = digest.obligations.map((item) => [
    item.title,
    item.file_name,
    item.due_at ? formatDate(item.due_at) : "—",
    taskDueLabel(item.days_until_due),
    item.status,
  ]);

  const generatedLabel = formatDate(digest.generated_at);

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Segoe UI,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#0891b2;">Vertia Legal</p>
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Resumen de vencimientos y tareas</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
      Generado el ${generatedLabel}. Horizonte de contratos: ${digest.expiration_horizon_days} días.
    </p>
    ${sectionTable(
      "Contratos por vencer",
      ["Documento", "Cliente", "Fecha", "Estado"],
      expirationRows,
      "Sin vencimientos en el horizonte configurado.",
    )}
    ${sectionTable(
      "Tareas próximas o vencidas",
      ["Tarea", "Responsable", "Fecha", "Estado", "Prioridad"],
      taskRows,
      "Sin tareas abiertas con fecha en el horizonte.",
    )}
    ${sectionTable(
      "Obligaciones contractuales",
      ["Obligación", "Contrato", "Fecha", "Estado", "Situación"],
      obligationRows,
      "Sin obligaciones pendientes en el horizonte.",
    )}
    <p style="margin:28px 0 0;">
      <a href="${siteUrl}" style="display:inline-block;padding:10px 18px;background:#0891b2;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        Abrir Vertia Legal
      </a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function buildDigestEmailText(
  digest: NotificationDigest,
  siteUrl: string,
): string {
  const lines: string[] = [
    "Vertia Legal — Resumen operativo",
    "",
    `Contratos por vencer (${digest.expirations.length}):`,
  ];

  for (const item of digest.expirations) {
    lines.push(
      `- ${item.file_name} (${item.client_name}) — ${formatDate(item.expires_at)} — ${expiryLabel(item.days_remaining)}`,
    );
  }

  lines.push("", `Tareas (${digest.tasks.length}):`);
  for (const item of digest.tasks) {
    lines.push(
      `- ${item.title} — ${item.assignee_name ?? "sin responsable"} — ${taskDueLabel(item.days_until_due)}`,
    );
  }

  lines.push("", `Obligaciones (${digest.obligations.length}):`);
  for (const item of digest.obligations) {
    lines.push(`- ${item.title} — ${item.file_name} — ${taskDueLabel(item.days_until_due)}`);
  }

  lines.push("", `Abrir: ${siteUrl}`);
  return lines.join("\n");
}
