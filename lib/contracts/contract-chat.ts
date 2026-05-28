import type { ContractSearchMatch } from "@/lib/contracts/search-intelligence";
import {
  runAssistedQuery,
  type AssistedQueryMode,
  type AssistedQueryResult,
} from "@/lib/contracts/assisted-query";

export type { AssistedQueryMode, AssistedQueryResult } from "@/lib/contracts/assisted-query";

export interface ContractChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ContractChatInput {
  message: string;
  mode?: AssistedQueryMode;
  historial?: ContractChatMessage[];
  contract_id?: string;
  contract_name?: string;
  matches?: ContractSearchMatch[];
}

export interface ContractChatResponse {
  respuesta: string;
  structured: AssistedQueryResult;
  contract_id: string | null;
  contexto_usado: boolean;
}

/** @deprecated Usar assisted-query; se mantiene por compatibilidad de imports. */
export const CONTRACT_ASSISTANT_PROMPT =
  "Consulta asistida estructurada — ver lib/contracts/assisted-query.ts";

export async function runContractChat(
  input: ContractChatInput,
  extractedText?: string | null,
): Promise<ContractChatResponse> {
  const result = await runAssistedQuery(
    {
      message: input.message,
      mode: input.mode,
      historial: input.historial,
      contract_id: input.contract_id,
      contract_name: input.contract_name,
      matches: input.matches,
    },
    extractedText,
  );

  return {
    respuesta: result.respuesta,
    structured: result.structured,
    contract_id: result.contract_id,
    contexto_usado: result.contexto_usado,
  };
}
