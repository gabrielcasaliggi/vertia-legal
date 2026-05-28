import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/contracts/activity-log";
import {
  buildClientPortfolioReportHtml,
  buildClientPortfolioReportMarkdown,
} from "@/lib/contracts/export";
import { getClient360 } from "@/lib/clients/client-360-service";
import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiErrorResponse | BodyInit>> {
  try {
    const { id } = await context.params;
    const format = request.nextUrl.searchParams.get("format") ?? "md";
    const payload = await getClient360(id);

    const markdown = buildClientPortfolioReportMarkdown({
      client: payload.summary.client,
      contracts: payload.contracts,
      expiringCount: payload.summary.expiringCount,
      pendingObligations: payload.summary.pendingObligations,
      openTasks: payload.summary.openTasks,
    });

    const safeName = payload.summary.client.name
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 40);

    await logActivity({
      action: "contract.exported",
      entityType: "studio_client",
      entityId: id,
      entityLabel: payload.summary.client.name,
      metadata: { report: "client_portfolio" },
    });

    if (format === "html") {
      const html = buildClientPortfolioReportHtml(markdown, payload.summary.client.name);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="portfolio-${safeName}.html"`,
        },
      });
    }

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="portfolio-${safeName}.md"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al exportar.";
    const status = message.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
