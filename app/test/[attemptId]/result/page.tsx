import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Test Result | MockTest",
  robots: { index: false, follow: false },
};

export default async function ResultPage(props: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await props.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/test/" + attemptId + "/result");

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("id,status,language,test_template_id,started_at,submitted_at")
    .eq("id", attemptId).eq("user_id", user.id).maybeSingle();

  if (!attempt) notFound();
  if (attempt.status !== "submitted") redirect("/test/" + attemptId);

  const [{ data: result }, { data: template }] = await Promise.all([
    supabase.from("results").select("correct_count,incorrect_count,unattempted_count,score,accuracy,time_taken_seconds").eq("attempt_id", attemptId).single(),
    supabase.from("test_templates").select("title,question_count,marks_per_question,negative_marks").eq("id", attempt.test_template_id).single(),
  ]);

  if (!result || !template) notFound();

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div><p className="eyebrow">Test completed</p><h1>{template.title}</h1><p className="muted">Language: {attempt.language.toUpperCase()}</p></div>
        <Link href="/dashboard">Dashboard</Link>
      </div>
      <div className="result-grid">
        <div className="result-card primary-result"><span>Score</span><strong>{Number(result.score).toFixed(2)}</strong></div>
        <div className="result-card"><span>Accuracy</span><strong>{Number(result.accuracy).toFixed(1)}%</strong></div>
        <div className="result-card"><span>Correct</span><strong>{result.correct_count}</strong></div>
        <div className="result-card"><span>Incorrect</span><strong>{result.incorrect_count}</strong></div>
        <div className="result-card"><span>Unattempted</span><strong>{result.unattempted_count}</strong></div>
        <div className="result-card"><span>Time</span><strong>{Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s</strong></div>
      </div>
      <section className="panel">
        <h2>Scoring summary</h2>
        <p className="muted">{template.question_count} questions · +{template.marks_per_question} for correct · −{template.negative_marks} for incorrect.</p>
        <Link className="button primary" href="/tests">Take another test</Link>
      </section>
    </main>
  );
}
