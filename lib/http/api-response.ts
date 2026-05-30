import type { ApiErrorResponse } from "@/lib/supabase/types";

export async function parseApiJsonResponse<T>(
  response: Response,
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const snippet = (await response.text()).slice(0, 200).trim();
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Sesión expirada o no autorizado. Volvé a iniciar sesión e intentá de nuevo.",
      );
    }
    if (response.status === 413) {
      throw new Error(
        "El archivo supera el límite permitido en el servidor (máx. 4 MB en producción).",
      );
    }
    if (snippet.startsWith("<!DOCTYPE") || snippet.startsWith("<html")) {
      throw new Error(
        "El servidor respondió con una página HTML en lugar de JSON. Revisá sesión, variables de entorno en Vercel o logs del deploy.",
      );
    }
    throw new Error(
      snippet || `Respuesta inesperada del servidor (${response.status}).`,
    );
  }

  return (await response.json()) as T;
}

export function apiErrorMessage(
  payload: ApiErrorResponse,
  fallback: string,
): string {
  return payload.details ?? payload.error ?? fallback;
}
