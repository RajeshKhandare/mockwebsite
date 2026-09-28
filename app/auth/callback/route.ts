import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/dashboard";

  if (code) {
    const response = NextResponse.redirect(new URL(next, url.origin));
    response.headers.set("Cache-Control", "private, no-store");

    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || !key) {
      return NextResponse.redirect(new URL("/login?error=callback", url.origin));
    }

    const supabase = createServerClient(supabaseUrl, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Email-confirmation callbacks can be the first successful authenticated
      // request after signup. Ensure the profile row exists without requiring
      // the server-only admin key.
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: typeof data.user.user_metadata?.display_name === "string"
          ? data.user.user_metadata.display_name.trim() || null
          : null,
      }, { onConflict: "id" });

      const email = data.user.email ?? "";
      const metadataName = typeof data.user.user_metadata?.display_name === "string"
        ? data.user.user_metadata.display_name.trim()
        : "";
      const label = metadataName || email.split("@")[0] || "Account";

      response.cookies.set("mock_user", JSON.stringify({ email, label }), {
        httpOnly: false,
        secure: url.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 400,
      });
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback", url.origin));
}
