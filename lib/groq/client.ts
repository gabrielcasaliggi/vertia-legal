import OpenAI from "openai";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const GROQ_MODEL = getOptionalEnv(
  "GROQ_MODEL",
  "llama-3.3-70b-versatile",
);
export const GROQ_VISION_MODEL = getOptionalEnv(
  "GROQ_VISION_MODEL",
  "llama-3.2-11b-vision-preview",
);
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export function createGroqClient(): OpenAI {
  return new OpenAI({
    apiKey: getRequiredEnv("GROQ_API_KEY"),
    baseURL: GROQ_BASE_URL,
  });
}
