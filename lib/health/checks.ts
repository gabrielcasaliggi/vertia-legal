import { createServerSupabaseClient } from "@/lib/supabase/server";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export interface HealthCheckResult {
  ok: boolean;
  checks: Record<string, { ok: boolean; detail?: string }>;
  runtime: {
    node: string;
    vercel: boolean;
    maxUploadMb: number;
    serverOcr: boolean;
  };
}

export function checkRequiredEnv(): Record<string, { ok: boolean; detail?: string }> {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};
  for (const key of REQUIRED_ENV) {
    checks[key] = process.env[key]
      ? { ok: true }
      : { ok: false, detail: "Variable ausente" };
  }
  checks.GROQ_API_KEY = process.env.GROQ_API_KEY
    ? { ok: true }
    : { ok: false, detail: "Opcional para indexación; requerida para IA" };
  return checks;
}

export async function checkSupabaseConnectivity(): Promise<{
  ok: boolean;
  detail?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("legal_contracts").select("id").limit(1);
    if (error) {
      return { ok: false, detail: error.message };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

export async function checkStorageBucket(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.storage.from("contracts").list("", { limit: 1 });
    if (error) {
      return { ok: false, detail: error.message };
    }
    return { ok: true, detail: data ? "bucket accesible" : undefined };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Storage no accesible",
    };
  }
}

export async function runHealthChecks(): Promise<HealthCheckResult> {
  const envChecks = checkRequiredEnv();
  const supabaseCheck = await checkSupabaseConnectivity();
  const storageCheck = await checkStorageBucket();

  const checks: HealthCheckResult["checks"] = {
    ...envChecks,
    supabase_db: supabaseCheck,
    storage_contracts: storageCheck,
  };

  const criticalOk =
    REQUIRED_ENV.every((key) => checks[key]?.ok) &&
    supabaseCheck.ok &&
    storageCheck.ok;

  return {
    ok: criticalOk,
    checks,
    runtime: {
      node: process.version,
      vercel: process.env.VERCEL === "1",
      maxUploadMb: process.env.VERCEL ? 4 : 10,
      serverOcr: process.env.ALLOW_SERVER_OCR === "true",
    },
  };
}
