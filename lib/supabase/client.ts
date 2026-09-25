import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error("Supabase browser environment variables are missing.");
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}
