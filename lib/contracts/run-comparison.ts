import { getCurrentProfile } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/require-permission";
import { persistContractComparison } from "@/lib/contracts/contract-comparisons";
import {
  assertContractInOrganization,
  requireOrganizationScope,
} from "@/lib/auth/tenant-scope";
import { logActivity } from "@/lib/contracts/activity-log";
import {
  buildDeterministicDifferences,
  CONTRACT_COMPARISON_SYSTEM_PROMPT,
  parseContractComparisonResult,
  type ComparisonContractInput,
  type ContractComparisonDocument,
  type ContractComparisonResponse,
} from "@/lib/contracts/compare";
import { createGroqClient, GROQ_MODEL } from "@/lib/groq/client";
import { rethrowGroqError, truncateForAnalysis } from "@/lib/groq/errors";
import { scanContractKnowledge, snapshotKnowledgeScan } from "@/lib/legal-knowledge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ContractAnalysisResult } from "@/lib/contracts/analysis";

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 120_000;
const MAX_TEXT_PER_CONTRACT = 3_600;

interface ComparisonContractRow extends ComparisonContractInput {
  id: string;
  status: string;
  extracted_text: string | null;
  analysis_result: ContractAnalysisResult | null;
}

export class ContractComparisonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractComparisonError";
  }
}

function assertComparableText(contract: ComparisonContractRow): string {
  const text = contract.extracted_text?.trim() ?? "";

  if (text.length < MIN_TEXT_LENGTH) {
    throw new ContractComparisonError(
      `El contrato "${contract.file_name}" no tiene texto indexado suficiente para comparar.`,
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new ContractComparisonError(
      `El contrato "${contract.file_name}" excede el límite de ${MAX_TEXT_LENGTH} caracteres.`,
    );
  }

  return text;
}

function toComparisonDocument(
  contract: ComparisonContractRow,
  text: string,
): ContractComparisonDocument {
  const scan = scanContractKnowledge(text);
  return {
    id: contract.id,
    file_name: contract.file_name,
    client_name: contract.client_name,
    folder_name: contract.folder_name,
    contract_type: contract.contract_type,
    party_a: contract.party_a,
    party_b: contract.party_b,
    starts_at: contract.starts_at,
    expires_at: contract.expires_at,
    status: contract.status,
    knowledge: snapshotKnowledgeScan(scan),
  };
}

function buildComparisonPrompt(input: {
  base: ComparisonContractRow;
  compared: ComparisonContractRow;
  baseText: string;
  comparedText: string;
}): string {
  const baseScan = scanContractKnowledge(input.baseText);
  const comparedScan = scanContractKnowledge(input.comparedText);
  const deterministicDifferences = buildDeterministicDifferences(
    input.base,
    input.compared,
  );

  const payload = {
    contrato_base: {
      id: input.base.id,
      archivo: input.base.file_name,
      cliente: input.base.client_name,
      carpeta: input.base.folder_name,
      tipo: input.base.contract_type,
      parte_a: input.base.party_a,
      parte_b: input.base.party_b,
      fecha_inicio: input.base.starts_at,
      fecha_fin: input.base.expires_at,
      renovacion_automatica: input.base.auto_renewal,
      dias_preaviso: input.base.renewal_notice_days,
      auditoria_previa: input.base.analysis_result
        ? {
            score_riesgo: input.base.analysis_result.score_riesgo,
            resumen: input.base.analysis_result.resumen_directorio,
          }
        : null,
      conocimiento_vertia: snapshotKnowledgeScan(baseScan),
      texto_relevante: truncateForAnalysis(input.baseText, MAX_TEXT_PER_CONTRACT),
    },
    contrato_comparado: {
      id: input.compared.id,
      archivo: input.compared.file_name,
      cliente: input.compared.client_name,
      carpeta: input.compared.folder_name,
      tipo: input.compared.contract_type,
      parte_a: input.compared.party_a,
      parte_b: input.compared.party_b,
      fecha_inicio: input.compared.starts_at,
      fecha_fin: input.compared.expires_at,
      renovacion_automatica: input.compared.auto_renewal,
      dias_preaviso: input.compared.renewal_notice_days,
      auditoria_previa: input.compared.analysis_result
        ? {
            score_riesgo: input.compared.analysis_result.score_riesgo,
            resumen: input.compared.analysis_result.resumen_directorio,
          }
        : null,
      conocimiento_vertia: snapshotKnowledgeScan(comparedScan),
      texto_relevante: truncateForAnalysis(input.comparedText, MAX_TEXT_PER_CONTRACT),
    },
    diferencias_deterministicas: deterministicDifferences,
  };

  return `Compará estos contratos. Usá las diferencias determinísticas como base, pero priorizá impacto legal y operativo.\n\n${JSON.stringify(payload, null, 2)}`;
}

export async function runContractComparison(input: {
  baseContractId: string;
  comparedContractId: string;
}): Promise<ContractComparisonResponse> {
  await requirePermission("run_audit");

  const baseContractId = input.baseContractId.trim();
  const comparedContractId = input.comparedContractId.trim();

  if (!baseContractId || !comparedContractId) {
    throw new ContractComparisonError("Se requieren dos contratos válidos para comparar.");
  }

  if (baseContractId === comparedContractId) {
    throw new ContractComparisonError("Seleccioná dos contratos distintos.");
  }

  const organizationId = await requireOrganizationScope();
  const supabase = createServerSupabaseClient();

  await assertContractInOrganization(supabase, baseContractId, organizationId);
  await assertContractInOrganization(supabase, comparedContractId, organizationId);

  const { data, error } = await supabase
    .from("legal_contracts")
    .select(
      "id, file_name, client_name, folder_name, contract_type, party_a, party_b, starts_at, expires_at, auto_renewal, renewal_notice_days, status, extracted_text, analysis_result",
    )
    .eq("organization_id", organizationId)
    .in("id", [baseContractId, comparedContractId]);

  if (error) {
    throw new ContractComparisonError(`No se pudieron cargar contratos: ${error.message}`);
  }

  const rows = (data ?? []) as ComparisonContractRow[];
  const base = rows.find((row) => row.id === baseContractId);
  const compared = rows.find((row) => row.id === comparedContractId);

  if (!base || !compared) {
    throw new ContractComparisonError("No se encontraron ambos contratos en la organización.");
  }

  const baseText = assertComparableText(base);
  const comparedText = assertComparableText(compared);
  const groq = createGroqClient();

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CONTRACT_COMPARISON_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildComparisonPrompt({ base, compared, baseText, comparedText }),
        },
      ],
      temperature: 0.15,
      max_tokens: 1900,
    });
  } catch (error) {
    rethrowGroqError(error);
  }

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new ContractComparisonError("Groq no devolvió contenido en la comparación.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch {
    throw new ContractComparisonError("La respuesta de Groq no es un JSON válido.");
  }

  const result = parseContractComparisonResult(parsedJson);
  if (!result) {
    throw new ContractComparisonError("La respuesta de Groq no cumple el esquema requerido.");
  }

  const comparison: ContractComparisonResponse = {
    comparison_id: crypto.randomUUID(),
    generated_at: new Date().toISOString(),
    base: toComparisonDocument(base, baseText),
    compared: toComparisonDocument(compared, comparedText),
    result,
  };

  const profile = await getCurrentProfile();

  await persistContractComparison({
    comparison,
    organizationId,
    actorUserId: profile?.id ?? null,
    actorName: profile?.full_name,
  });

  await logActivity({
    action: "contract.compared",
    entityType: "contract_comparison",
    entityId: comparison.comparison_id,
    entityLabel: `${base.file_name} vs ${compared.file_name}`,
    metadata: {
      base_contract_id: base.id,
      compared_contract_id: compared.id,
      cambios_criticos: result.cambios_criticos.length,
      documento_mas_riesgoso: result.riesgo_comparativo.documento_mas_riesgoso,
    },
  });

  return comparison;
}
