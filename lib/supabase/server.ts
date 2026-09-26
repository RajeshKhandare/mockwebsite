import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const runtimeEnv = process.env as Record<string, string | undefined>;
  const baseUrl = runtimeEnv["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    runtimeEnv["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ??
    runtimeEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!baseUrl || !key) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createServerClient(baseUrl, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always mutate cookies. Proxy refreshes sessions.
        }
      },
    },
  });
}
