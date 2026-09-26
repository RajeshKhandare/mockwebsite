export async function supabaseRestGet<T>(
  table: string,
  query: Record<string, string>,
  options: { single?: boolean } = {},
): Promise<T> {
  const runtimeEnv = process.env as Record<string, string | undefined>;
  const baseUrl = runtimeEnv["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    runtimeEnv["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ??
    runtimeEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!baseUrl || !key) {
    throw new Error("Supabase public environment variables are missing.");
  }

  const url = new URL(`/rest/v1/${table}`, baseUrl);
  Object.entries(query).forEach(([name, value]) => url.searchParams.set(name, value));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: options.single ? "application/vnd.pgrst.object+json" : "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase catalog request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
