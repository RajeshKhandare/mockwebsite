import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

// Supabase session refresh must also run on live-test and attempt API routes.
// Otherwise a valid browser session can be visible in the UI while the
// server-side test RPC still sees auth.uid() as null.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/auth/callback",
    "/test/:path*",
    "/api/attempts/:path*",
    "/api/questions/:path*",
  ],
};
