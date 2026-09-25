import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error("Supabase server secret environment variables are missing.");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
