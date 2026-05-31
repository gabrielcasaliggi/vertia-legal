import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import { LEGAL_AUDITOR_VISION_PROMPT } from "@/lib/contracts/analysis";
import {
  assertContractReadyForAnalysis,
  ContractAnalysisError,
  parseGroqAnalysisResponse,
  persistContractAnalysis,
} from "@/lib/contracts/analysis-service";
import {
  assertContractInOrganization,
  requireOrganizationScope,
} from "@/lib/auth/tenant-scope";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ContractAnalysisResult } from "@/lib/contracts/analysis";
import { createGroqClient, GROQ_VISION_MODEL } from "@/lib/groq/client";
import { rethrowGroqError } from "@/lib/groq/errors";

export { ContractAnalysisError };

export async function runVisionContractAnalysis(
  contractId: string,
  pageImages: Buffer[],
): Promise<ContractAnalysisResult> {
  if (pageImages.length === 0) {
    throw new ContractAnalysisError(
      "Se requiere al menos una página renderizada para OCR visual.",
    );
  }

  const organizationId = await requireOrganizationScope();
  const supabase = createServerSupabaseClient();
  await assertContractInOrganization(supabase, contractId, organizationId);
  await assertContractReadyForAnalysis(contractId, organizationId);

  const imageParts: ChatCompletionContentPart[] = pageImages.map((pageBuffer) => ({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${pageBuffer.toString("base64")}`,
        detail: "high",
    },
  }));

  const groq = createGroqClient();

  let completion;

  try {
    completion = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: LEGAL_AUDITOR_VISION_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza este contrato legal argentino escaneado. Las ${pageImages.length} imagen(es) adjunta(s) contienen el documento completo o parcial. Realiza OCR efímero sobre todo texto legible y ejecuta auditoría CCCN con citas literales de cláusulas reales detectadas. Devuelve solo el JSON estricto solicitado.`,
            },
            ...imageParts,
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });
  } catch (error) {
    rethrowGroqError(error);
  }

  const rawContent = completion.choices[0]?.message?.content;

  if (!rawContent) {
    throw new ContractAnalysisError(
      "Groq Vision no devolvió contenido en la respuesta.",
    );
  }

  const analysis = parseGroqAnalysisResponse(rawContent);
  await persistContractAnalysis(contractId, analysis);

  return analysis;
}
