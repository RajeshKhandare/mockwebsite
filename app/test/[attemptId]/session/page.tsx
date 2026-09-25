import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TestSession from "./session";

export const metadata: Metadata = {
  title: "Live Test | MockTest",
  robots: { index: false, follow: false },
};

export default async function TestSessionPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/test/" + attemptId + "/session");

  return <TestSession attemptId={attemptId} />;
}
