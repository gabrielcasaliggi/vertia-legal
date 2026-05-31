import { NextRequest, NextResponse } from "next/server";
import { parseContractAnalysisResult } from "@/lib/contracts/analysis";
import {
  buildAuditReportMarkdown,
  markdownToPrintableHtml,
} from "@/lib/contracts/export";
import { buildReportBranding } from "@/lib/contracts/report-branding";
import { logActivity } from "@/lib/contracts/activity-log";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireOrganizationScope } from "@/lib/auth/tenant-scope";
import { getOrganizationSettings } from "@/lib/organizations/settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiErrorResponse | BodyInit>> {
  try {
    await requirePermission("export_reports");
    const organizationId = await requireOrganizationScope();
    const { id } = await context.params;
    const format = request.nextUrl.searchParams.get("format") ?? "md";
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("legal_contracts")
      .select(
        "file_name, client_name, folder_name, contract_type, party_a, party_b, lifecycle_status, expires_at, analysis_result, status",
      )
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "No se pudo exportar el informe.", details: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Contrato no encontrado." }, { status: 404 });
    }

    const analysis = parseContractAnalysisResult(data.analysis_result);
    if (!analysis) {
      return NextResponse.json(
        {
          error: "El contrato no tiene auditoría cognitiva. Ejecute la auditoría antes de exportar.",
        },
        { status: 400 },
      );
    }

    const settings = await getOrganizationSettings(organizationId);
    const branding = buildReportBranding(settings);

    const markdown = buildAuditReportMarkdown({
      file_name: data.file_name,
      client_name: data.client_name,
      folder_name: data.folder_name,
      contract_type: data.contract_type,
      party_a: data.party_a,
      party_b: data.party_b,
      lifecycle_status: data.lifecycle_status,
      expires_at: data.expires_at,
      analysis,
    });

    const safeName = data.file_name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 60);

    await logActivity({
      action: "contract.exported",
      entityType: "legal_contract",
      entityId: id,
      entityLabel: data.file_name,
      metadata: { format },
    });

    if (format === "html") {
      const html = markdownToPrintableHtml(
        markdown,
        `Auditoría — ${data.file_name}`,
        branding,
      );
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="informe-auditoria-${safeName}.html"`,
        },
      });
    }

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="informe-auditoria-${safeName}.md"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado.";
    const status = message.includes("permiso") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
