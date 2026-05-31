#!/usr/bin/env node
/**
 * Captura screenshots de producción para la landing.
 * Uso: node scripts/capture-landing-screenshots.mjs
 * Requiere: .env.local con SUPABASE_* y playwright (`npx playwright install chromium`)
 */
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "../Landing/public/img/vertia-legal");

function loadEnvLocal() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = (
  process.env.LEGAL_SCREENSHOT_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://legal.vertia.net.ar"
)
  .replace(/\/$/, "")
  .replace("http://localhost:3000", "https://legal.vertia.net.ar");

if (!url || !serviceKey) {
  console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SHOTS = [
  { name: "dashboard", path: "/", wait: 2500 },
  {
    name: "contrato",
    path: "/contracts/b3000001-0001-4001-8001-000000000002",
    wait: 3000,
  },
];

async function resolveLoginEmail() {
  const forced = process.env.LEGAL_SCREENSHOT_EMAIL?.trim();
  if (forced) return forced;

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 50 });
  if (error) throw error;

  const users = data.users ?? [];
  const preferred = users.find((u) => u.email && !u.email.includes("platform"));
  return preferred?.email ?? users[0]?.email ?? null;
}

async function getMagicLink(email) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/` },
  });
  if (error) throw error;
  return data.properties?.action_link ?? data.action_link;
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const email = await resolveLoginEmail();
  if (!email) {
    console.error("No hay usuarios en Auth para generar magic link.");
    process.exit(1);
  }

  console.log(`Login vía magic link (${email})…`);
  const actionLink = await getMagicLink(email);
  if (!actionLink) {
    console.error("No se pudo generar magic link.");
    process.exit(1);
  }

  const chromePath =
    process.env.CHROME_PATH ??
    ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"].find((p) =>
      existsSync(p),
    );

  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(actionLink, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForURL(/legal\.vertia\.net\.ar(?!\/login)/, { timeout: 60000 }).catch(() => {});

  for (const shot of SHOTS) {
    const target = `${siteUrl}${shot.path}`;
    console.log(`Capturando ${shot.name} → ${target}`);
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(shot.wait);
    await page.screenshot({
      path: resolve(outDir, `${shot.name}.png`),
      fullPage: false,
    });
  }

  await browser.close();
  console.log(`Listo. Imágenes en ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
