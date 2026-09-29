import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./server";

export async function createSupabaseRequestClient(request: Request) {
  const runtimeEnv = process.env as Record<string, string | undefined>;
  const baseUrl = runtimeEnv["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    runtimeEnv["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ??
    runtimeEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!baseUrl || !key) throw new Error("Supabase environment variables are missing.");

  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return createClient(baseUrl, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: authorization } },
    });
  }

  return createSupabaseServerClient();
}
