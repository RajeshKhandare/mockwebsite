import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import QuestionReview from "./review";

export const metadata: Metadata = {
  title: "Question Review | MockTest",
  robots: { index: false, follow: false },
};

export default async function AdminQuestionsPage() {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) redirect("/login?next=/admin/questions");

  const db = createSupabaseAdminClient();
  const { data: questions } = await db
    .from("questions")
    .select("id,language,question_text,explanation,difficulty,status,source_type,created_at")
    .in("status", ["pending", "approved", "rejected"])
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (questions ?? []).map((q) => q.id);
  const { data: options } = ids.length
    ? await db.from("question_options").select("question_id,option_index,option_text,is_correct").in("question_id", ids).order("option_index")
    : { data: [] };

  const grouped = new Map<string, typeof options>();
  for (const option of options ?? []) grouped.set(option.question_id, [...(grouped.get(option.question_id) ?? []), option]);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div><p className="eyebrow">Admin · question pool</p><h1>Question review</h1><p className="muted">Approve only questions that pass content, option and answer-key checks.</p></div>
        <Link href="/admin">Admin home</Link>
      </div>
      <div className="list-stack">
        {(questions ?? []).map((question) => (
          <QuestionReview key={question.id} question={question} options={grouped.get(question.id) ?? []} />
        ))}
        {!questions?.length && <p className="empty-state">No questions are currently in the review queue.</p>}
      </div>
    </main>
  );
}
