import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let supabaseAdmin: SupabaseClient<Database> | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createServerSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient<Database>(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return supabaseAdmin;
}
