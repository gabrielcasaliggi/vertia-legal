import { describe, expect, it } from "vitest";
import { checkRequiredEnv } from "@/lib/health/checks";
import { jsonError } from "@/lib/http/json-error";

describe("health checks", () => {
  it("detecta variables requeridas ausentes", () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const checks = checkRequiredEnv();
    expect(checks.NEXT_PUBLIC_SUPABASE_URL?.ok).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  });
});

describe("jsonError", () => {
  it("devuelve JSON con status", async () => {
    const response = jsonError("Error", 400, "Detalle");
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Error");
    expect(body.details).toBe("Detalle");
  });
});
