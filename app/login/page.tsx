import type { Metadata } from "next";
import AuthPanel from "./auth-panel";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Account | MockTest",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const message = typeof params.message === "string" ? params.message : "";
  const next = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/dashboard";
  const supabase = createSupabasePublicClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("id,name")
    .eq("is_active", true)
    .order("name")
    .limit(100);

  return <main className="page-shell narrow-shell"><AuthPanel next={next} error={error} message={message} exams={exams ?? []} /></main>;
}
