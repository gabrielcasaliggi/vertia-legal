import OpenAI from "openai";

export class GroqRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroqRateLimitError";
  }
}

function extractRetryHint(message: string): string {
  const match = message.match(/try again in ([^.]+)/i);
  return match?.[1] ? `Reintentá en ${match[1].trim()}.` : "Reintentá más tarde.";
}

export function isGroqRateLimitError(error: unknown): boolean {
  return (
    error instanceof GroqRateLimitError ||
    (error instanceof OpenAI.APIError && (error.status === 429 || error.status === 413))
  );
}

export function rethrowGroqError(error: unknown): never {
  if (error instanceof OpenAI.APIError && error.status === 413) {
    throw new GroqRateLimitError(
      "La solicitud enviada a Groq excede el límite de tokens del plan actual. Se redujo el contexto máximo; reintentá la auditoría.",
    );
  }

  if (error instanceof OpenAI.APIError && error.status === 429) {
    throw new GroqRateLimitError(
      `Cuota o límite temporal de Groq agotado para el modelo configurado. ${extractRetryHint(error.message)} Podés cambiar GROQ_MODEL a llama-3.3-70b-versatile o esperar el reinicio de la ventana TPM.`,
    );
  }

  throw error;
}

export function truncateForAnalysis(
  text: string,
  maxChars: number = 8_500,
): string {
  const normalized = text.trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  const headLength = Math.floor(maxChars * 0.72);
  const tailLength = maxChars - headLength - 120;

  return `${normalized.slice(0, headLength)}

[... contenido intermedio truncado para respetar límites TPM de Groq ...]

${normalized.slice(-tailLength)}`;
}
