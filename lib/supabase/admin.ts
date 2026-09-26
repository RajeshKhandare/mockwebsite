import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const runtimeEnv = process.env as Record<string, string | undefined>;
  const baseUrl = runtimeEnv["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    runtimeEnv["SUPABASE_SECRET_KEY"] ??
    runtimeEnv["SUPABASE_SERVICE_ROLE_KEY"];

  if (!baseUrl || !key) {
    throw new Error("Supabase server secret environment variables are missing.");
  }

  return createClient(baseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
