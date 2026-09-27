import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(new URL(next, url.origin));
      const user = data.user;
      const email = user?.email ?? "";
      const metadataName = typeof user?.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name.trim()
        : "";
      const label = metadataName || email.split("@")[0] || "Account";
      if (user) {
        response.cookies.set("mock_user", JSON.stringify({ email, label }), {
          httpOnly: false,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 400,
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback", url.origin));
}
