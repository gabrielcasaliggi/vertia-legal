import type { ApiErrorResponse } from "@/lib/supabase/types";

function extractHtmlTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) {
    return null;
  }
  return match[1].replace(/\s+/g, " ").trim();
}

function describeHtmlError(response: Response, snippet: string): string {
  const title = extractHtmlTitle(snippet);
  const server = response.headers.get("server");
  const cfRay = response.headers.get("cf-ray");
  const vercelId = response.headers.get("x-vercel-id");
  const location = response.headers.get("location");
  const source = cfRay
    ? "Cloudflare"
    : vercelId || server?.toLowerCase().includes("vercel")
      ? "Vercel"
      : server ?? "servidor";

  const details = [
    `status ${response.status}`,
    `origen probable: ${source}`,
    title ? `título: ${title}` : null,
    response.redirected ? `redirección a ${response.url}` : null,
    location ? `location: ${location}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `El servidor respondió HTML en lugar de JSON (${details}). Revisá logs del deploy y la pestaña Network.`;
}

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
      throw new Error(describeHtmlError(response, snippet));
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
