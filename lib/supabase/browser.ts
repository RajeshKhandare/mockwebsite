import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !key) {
    throw new Error("Supabase browser environment variables are missing.");
  }

  return createBrowserClient(baseUrl, key);
}
