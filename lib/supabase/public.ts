import { createClient } from "@supabase/supabase-js";

export function createSupabasePublicClient() {
  const runtimeEnv = process.env as Record<string, string | undefined>;
  const baseUrl = runtimeEnv["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    runtimeEnv["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ??
    runtimeEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!baseUrl || !key) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return createClient(baseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
