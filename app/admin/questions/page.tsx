import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import QuestionReview from "./review";

export const metadata: Metadata = { title: "Question Review | MockTest", robots: { index: false, follow: false } };

export default async function AdminQuestionsPage() {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) redirect("/login?next=/admin/questions");

  const db = createSupabaseAdminClient();
  const { data: questions } = await db
    .from("questions")
    .select("id,language,question_text,explanation,difficulty,status,source_type,created_at,quality_score,quality_confidence,validation_status,review_required")
    .in("status", ["pending", "needs_review", "approved", "rejected"])
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (questions ?? []).map((q) => q.id);
  const { data: options } = ids.length
    ? await db.from("question_options").select("question_id,option_index,option_text,is_correct").in("question_id", ids).order("option_index")
    : { data: [] };

  const grouped = new Map<string, typeof options>();
  for (const option of options ?? []) grouped.set(option.question_id, [...(grouped.get(option.question_id) ?? []), option]);

  const reviewCount = (questions ?? []).filter((q) => q.status === "pending" || q.status === "needs_review").length;
  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin · question operations</p>
          <h1>Question review queue</h1>
          <p className="muted">Automatic validation handles structural checks and near-duplicates. You only need to inspect exceptions and semantic concerns.</p>
        </div>
        <div className="button-row">
          <Link className="button" href="/admin">Admin home</Link>
          <Link className="button primary" href="/admin/generation">Question factory</Link>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><strong>{reviewCount}</strong><span>Needs attention</span></div>
        <div className="stat-card"><strong>{(questions ?? []).filter(q => q.status === "approved").length}</strong><span>Approved in view</span></div>
        <div className="stat-card"><strong>{(questions ?? []).filter(q => q.status === "rejected").length}</strong><span>Rejected in view</span></div>
      </div>
      <div className="list-stack">
        {(questions ?? []).map((question) => (
          <QuestionReview key={question.id} question={question} options={grouped.get(question.id) ?? []} />
        ))}
        {!questions?.length && <p className="empty-state">No questions are currently in the queue.</p>}
      </div>
    </main>
  );
}
