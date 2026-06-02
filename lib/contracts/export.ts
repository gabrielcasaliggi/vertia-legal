import type { ContractAnalysisResult } from "@/lib/contracts/analysis";
import { LIFECYCLE_LABELS, formatExpiryLabel } from "@/lib/contracts/lifecycle";
import type { LifecycleStatus } from "@/lib/contracts/lifecycle";
import type { ContractSearchMatch } from "@/lib/contracts/search-intelligence";
import type { ReportBranding } from "@/lib/contracts/report-branding";
import type { ContractListItem } from "@/lib/supabase/types";
import type { StudioClient } from "@/lib/clients/studio-clients";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildSearchResultsCsv(matches: ContractSearchMatch[]): string {
  const headers = [
    "archivo",
    "cliente",
    "carpeta",
    "tipo_contrato",
    "parte_a",
    "parte_b",
    "estado_ciclo",
    "riesgo",
    "dias_criticos",
    "vencimiento",
    "extracto",
  ];

  const lines = [headers.join(",")];

  for (const match of matches) {
    const plainSnippet = match.snippet.replace(/【|】/g, "");
    lines.push(
      [
        escapeCsv(match.archivo),
        escapeCsv(match.client_name),
        escapeCsv(match.folder_name),
        escapeCsv(match.contract_type ?? ""),
        escapeCsv(match.party_a ?? ""),
        escapeCsv(match.party_b ?? ""),
        escapeCsv(LIFECYCLE_LABELS[match.lifecycle_status]),
        match.riesgo,
        match.dias_criticos?.toString() ?? "",
        match.expires_at?.slice(0, 10) ?? "",
        escapeCsv(plainSnippet),
      ].join(","),
    );
  }

  return lines.join("\n");
}

export function buildAuditReportMarkdown(input: {
  file_name: string;
  client_name: string;
  folder_name: string;
  contract_type: string | null;
  party_a: string | null;
  party_b: string | null;
  lifecycle_status: LifecycleStatus;
  expires_at: string | null;
  analysis: ContractAnalysisResult;
}): string {
  const lines: string[] = [
    "# Informe de auditoría contractual",
    "",
    `**Documento:** ${input.file_name}`,
    `**Cliente:** ${input.client_name}`,
    `**Carpeta:** ${input.folder_name}`,
    `**Tipo:** ${input.contract_type ?? "Sin clasificar"}`,
    `**Parte A:** ${input.party_a ?? "n/d"}`,
    `**Parte B:** ${input.party_b ?? "n/d"}`,
    `**Estado:** ${LIFECYCLE_LABELS[input.lifecycle_status]}`,
    `**Vencimiento:** ${input.expires_at ? formatExpiryLabel(input.expires_at) : "No determinado"}`,
  ];

  if (input.expires_at) {
    lines.push(`**Fecha fin:** ${input.expires_at.slice(0, 10)}`);
  }

  lines.push(
    "",
    `## Score de riesgo: ${input.analysis.score_riesgo}/100`,
    "",
    "## Resumen ejecutivo",
    "",
    input.analysis.resumen_directorio,
    "",
  );

  const knowledge = input.analysis.conocimiento_vertia;
  if (knowledge) {
    lines.push(
      "## Inteligencia Vertia (pre-IA)",
      "",
      `- Escaneado: ${knowledge.scanned_at}`,
      `- Señales detectadas: ${knowledge.signal_count}`,
      `- Reglas aplicadas: ${knowledge.rule_count}`,
      "",
    );

    if (knowledge.signals.length > 0) {
      lines.push("### Señales automáticas", "");
      knowledge.signals.forEach((signal, index) => {
        lines.push(
          `${index + 1}. **${signal.descripcion}** (${signal.tag})`,
          signal.evidencia ? `   - Extracto: "${signal.evidencia}"` : "",
          "",
        );
      });
    }

    if (knowledge.rules.length > 0) {
      lines.push("### Reglas internas", "");
      knowledge.rules.forEach((rule) => {
        lines.push(
          `- **${rule.titulo}** (${rule.norma}) — riesgo ${rule.riesgo}, confianza ${rule.confianza}`,
          `  ${rule.regla}`,
          "",
        );
      });
    }
  }

  lines.push("## Cláusulas de riesgo", "");

  if (input.analysis.clausulas_riesgo.length === 0) {
    lines.push("_Sin cláusulas críticas detectadas._");
  } else {
    input.analysis.clausulas_riesgo.forEach((clausula, index) => {
      lines.push(
        `### ${index + 1}. ${clausula.tipo === "rojo" ? "Riesgo alto" : "Advertencia"}`,
        "",
        `**Extracto:** ${clausula.texto_original}`,
        "",
        `**Motivo:** ${clausula.motivo}`,
        "",
        `**Sugerencia:** ${clausula.sugerencia}`,
        "",
      );
    });
  }

  const meta = input.analysis.metadatos;
  if (meta) {
    lines.push(
      "## Metadatos extraídos",
      "",
      `- Tipo contractual: ${meta.tipo_contrato ?? "n/d"}`,
      `- Renovación automática: ${meta.renovacion_automatica ? "Sí" : "No"}`,
      `- Días aviso rescisión: ${meta.dias_aviso_rescision ?? "n/d"}`,
      "",
    );

    if (meta.obligaciones_clave.length > 0) {
      lines.push("### Obligaciones clave", "");
      meta.obligaciones_clave.forEach((item) => {
        lines.push(`- ${item}`);
      });
      lines.push("");
    }
  }

  lines.push("---", "", `_Generado por Vertia Legal — ${new Date().toISOString().slice(0, 10)}_`);

  return lines.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function markdownToPrintableHtml(
  markdown: string,
  title: string,
  branding?: ReportBranding,
): string {
  const generatedAt = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const brandName = branding?.brandName ?? "Vertia Legal";
  const responsibleLine = branding?.responsibleName
    ? `Responsable: ${branding.responsibleName}`
    : null;
  const contactLine = [branding?.contactEmail, branding?.contactPhone]
    .filter(Boolean)
    .join(" · ");
  const disclaimer = branding?.disclaimer;
  const body = markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) {
        return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      }
      if (line.startsWith("## ")) {
        return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      }
      if (line.startsWith("### ")) {
        return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      }
      if (line.startsWith("- ")) {
        return `<li>${escapeHtml(line.slice(2))}</li>`;
      }
      if (line.startsWith("**") && line.includes(":**")) {
        const [label, ...rest] = line.replace(/\*\*/g, "").split(":");
        return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(rest.join(":").trim())}</p>`;
      }
      if (line.trim() === "" || line.startsWith("---")) {
        return "";
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #e5edf5;
      color: #0f172a;
      font-family: Inter, Arial, sans-serif;
      line-height: 1.55;
    }
    .page {
      max-width: 980px;
      margin: 32px auto;
      background: #ffffff;
      border: 1px solid #dbe5ef;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
    }
    .cover {
      padding: 34px 42px 28px;
      background: linear-gradient(135deg, #0f172a 0%, #0e7490 100%);
      color: #ffffff;
    }
    .brand {
      margin: 0 0 28px;
      color: #a5f3fc;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .cover h1 {
      margin: 0;
      max-width: 760px;
      font-size: 30px;
      line-height: 1.15;
      letter-spacing: -0.03em;
    }
    .cover-meta {
      margin: 16px 0 0;
      color: #dbeafe;
      font-size: 13px;
    }
    .content { padding: 34px 42px 42px; }
    .content h1 { display: none; }
    h2 {
      margin: 30px 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #dbe5ef;
      color: #0f172a;
      font-size: 18px;
      letter-spacing: -0.01em;
    }
    h3 {
      margin: 20px 0 8px;
      color: #164e63;
      font-size: 15px;
    }
    p, li { font-size: 13.5px; }
    p { margin: 7px 0; }
    li {
      margin: 6px 0;
      padding: 8px 10px;
      list-style-position: inside;
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      background: #f8fafc;
    }
    strong { color: #0f172a; }
    .footer {
      margin-top: 34px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 11px;
    }
    .print-actions {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: flex-end;
      max-width: 980px;
      margin: 0 auto;
      padding: 10px 0;
    }
    .print-actions button {
      border: 0;
      border-radius: 999px;
      background: #0891b2;
      color: white;
      cursor: pointer;
      font-weight: 700;
      padding: 10px 16px;
    }
    @page { margin: 16mm; }
    @media print {
      body { background: #ffffff; }
      .page { margin: 0; border: 0; box-shadow: none; max-width: none; }
      .cover { border-radius: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .print-actions { display: none; }
      h2 { break-after: avoid; }
      h3, li, p { break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="print-actions"><button onclick="window.print()">Imprimir / guardar PDF</button></div>
<article class="page">
  <header class="cover">
    <p class="brand">${escapeHtml(brandName)}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="cover-meta">Informe profesional generado el ${escapeHtml(generatedAt)}</p>
    ${responsibleLine ? `<p class="cover-meta">${escapeHtml(responsibleLine)}</p>` : ""}
    ${contactLine ? `<p class="cover-meta">${escapeHtml(contactLine)}</p>` : ""}
  </header>
  <main class="content">
${body}
    <p class="footer">${escapeHtml(disclaimer ?? "Vertia Legal — documento generado para entrega profesional.")}</p>
  </main>
</article>
</body>
</html>`;
}

export function buildClientPortfolioReportMarkdown(input: {
  client: StudioClient;
  contracts: ContractListItem[];
  expiringCount: number;
  pendingObligations: number;
  openTasks: number;
}): string {
  const { client, contracts } = input;
  const lines: string[] = [
    `# Informe de portfolio — ${client.name}`,
    "",
    "## Resumen ejecutivo",
    "",
    `- Expedientes activos: ${contracts.length}`,
    `- Vencimientos próximos (90 días): ${input.expiringCount}`,
    `- Obligaciones pendientes: ${input.pendingObligations}`,
    `- Tareas abiertas: ${input.openTasks}`,
    "",
  ];

  if (client.cuit) {
    lines.push(`- CUIT: ${client.cuit}`);
  }
  if (client.responsible_name) {
    lines.push(`- Responsable del estudio: ${client.responsible_name}`);
  }
  if (client.practice_area) {
    lines.push(`- Rubro: ${client.practice_area}`);
  }

  lines.push("", "## Expedientes", "");

  if (contracts.length === 0) {
    lines.push("_Sin expedientes vinculados formalmente._");
  } else {
    contracts.forEach((contract, index) => {
      lines.push(
        `### ${index + 1}. ${contract.file_name}`,
        "",
        `- Estado: ${LIFECYCLE_LABELS[contract.lifecycle_status]}`,
        `- Tipo: ${contract.contract_type ?? "Sin clasificar"}`,
        `- Vencimiento: ${contract.expires_at ? formatExpiryLabel(contract.expires_at) : "No determinado"}`,
        `- Carpeta: ${contract.folder_name}`,
        "",
      );
    });
  }

  lines.push(
    "---",
    "",
    `_Generado por Vertia Legal — ${new Date().toISOString().slice(0, 10)}_`,
  );

  return lines.join("\n");
}

export function buildClientPortfolioReportHtml(
  markdown: string,
  clientName: string,
  branding?: ReportBranding,
): string {
  return markdownToPrintableHtml(markdown, `Portfolio — ${clientName}`, branding);
}
