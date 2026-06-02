import { NextResponse } from "next/server";
import { fetchContractAudits } from "@/lib/contracts/contract-audits";
import {
  assertContractInOrganization,
  requireOrganizationScope,
} from "@/lib/auth/tenant-scope";
import { jsonError } from "@/lib/http/json-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ApiErrorResponse } from "@/lib/supabase/types";
import type { ContractAuditRecord } from "@/lib/contracts/contract-audits";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse<{ audits: ContractAuditRecord[] } | ApiErrorResponse>> {
  try {
    const { id: contractId } = await context.params;
    const organizationId = await requireOrganizationScope();
    const supabase = createServerSupabaseClient();
    await assertContractInOrganization(supabase, contractId, organizationId);

    const audits = await fetchContractAudits(contractId, 15);

    return NextResponse.json({ audits });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar historial de auditorías.";
    return jsonError(message, 500);
  }
}
