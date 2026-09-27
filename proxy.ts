import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

// Keep Supabase session refresh off public/catalog traffic. Public pages are
// intentionally cache-friendly; only account/admin/callback routes need it.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/auth/callback",
  ],
};
