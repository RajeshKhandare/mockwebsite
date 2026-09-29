import { createSupabaseBrowserClient } from "./browser";

export async function getSupabaseAuthHeaders() {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = "Bearer " + session.access_token;
  return headers;
}
