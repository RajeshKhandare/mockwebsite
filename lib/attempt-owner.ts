import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAttemptOwner() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { userId: user.id, guestToken: null as string | null };
  const cookieStore = await cookies();
  return { userId: null as string | null, guestToken: cookieStore.get("mock_guest")?.value ?? null };
}
