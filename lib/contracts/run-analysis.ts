import {
  LEGAL_AUDITOR_SYSTEM_PROMPT,
  type ContractAnalysisResult,
} from "@/lib/contracts/analysis";
import {
  assertContractReadyForAnalysis,
  ContractAnalysisError,
  parseGroqAnalysisResponse,
  persistContractAnalysis,
} from "@/lib/contracts/analysis-service";
import { logActivity } from "@/lib/contracts/activity-log";
import { persistContractAudit } from "@/lib/contracts/contract-audits";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  assertContractInOrganization,
  requireOrganizationScope,
} from "@/lib/auth/tenant-scope";
import {
  attachKnowledgeToAnalysis,
  augmentAuditorSystemPrompt,
  scanContractKnowledge,
} from "@/lib/legal-knowledge";
import { createGroqClient, GROQ_MODEL } from "@/lib/groq/client";
import { rethrowGroqError, truncateForAnalysis } from "@/lib/groq/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 120_000;

export { ContractAnalysisError };

export async function runContractAnalysis(
  contractId: string,
  text?: string,
): Promise<ContractAnalysisResult> {
  const organizationId = await requireOrganizationScope();
  const supabase = createServerSupabaseClient();
  await assertContractInOrganization(supabase, contractId, organizationId);

  const sourceText =
    text ?? (await assertContractReadyForAnalysis(contractId, organizationId)).extracted_text;
  const normalizedText = sourceText.trim();

  if (normalizedText.length < MIN_TEXT_LENGTH) {
    throw new ContractAnalysisError(
      `El texto indexado debe tener al menos ${MIN_TEXT_LENGTH} caracteres.`,
    );
  }

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    throw new ContractAnalysisError(
      `El texto indexado excede el límite de ${MAX_TEXT_LENGTH} caracteres.`,
    );
  }

  const knowledgeScan = scanContractKnowledge(normalizedText);
  const systemPrompt = augmentAuditorSystemPrompt(
    LEGAL_AUDITOR_SYSTEM_PROMPT,
    knowledgeScan,
  );

  const groq = createGroqClient();
  const analysisInput = truncateForAnalysis(normalizedText);

  let completion;

  try {
    completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analiza el siguiente contrato y devuelve el JSON estricto solicitado:\n\n${analysisInput}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1800,
    });
  } catch (error) {
    rethrowGroqError(error);
  }

  const rawContent = completion.choices[0]?.message?.content;

  if (!rawContent) {
    throw new ContractAnalysisError("Groq no devolvió contenido en la respuesta.");
  }

  const analysis = attachKnowledgeToAnalysis(
    parseGroqAnalysisResponse(rawContent),
    knowledgeScan,
  );
  await persistContractAnalysis(contractId, analysis);

  const profile = await getCurrentProfile();

  await persistContractAudit({
    contractId,
    analysis,
    actorUserId: profile?.id ?? null,
    actorName: profile?.full_name,
    organizationId,
  });

  const { data: contractRow } = await supabase
    .from("legal_contracts")
    .select("file_name")
    .eq("id", contractId)
    .maybeSingle();

  await logActivity({
    action: "contract.analyzed",
    entityType: "legal_contract",
    entityId: contractId,
    entityLabel: contractRow?.file_name ?? contractId,
    metadata: { score_riesgo: analysis.score_riesgo },
  });

  return analysis;
}
