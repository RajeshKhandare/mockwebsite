import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Test Analysis | MockTest",
  robots: { index: false, follow: false },
};

export default async function AnalysisPage(props: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await props.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/test/" + attemptId + "/analysis");

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("id,status,test_template_id,language")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attempt) notFound();
  if (attempt.status !== "submitted") redirect("/test/" + attemptId);

  const [{ data: result }, { data: template }, { data: links }, { data: answers }] = await Promise.all([
    supabase.from("results").select("correct_count,incorrect_count,unattempted_count,score,accuracy,time_taken_seconds").eq("attempt_id", attemptId).single(),
    supabase.from("test_templates").select("title").eq("id", attempt.test_template_id).single(),
    supabase.from("test_attempt_questions").select("question_id,position").eq("attempt_id", attemptId).order("position"),
    supabase.from("test_answers").select("question_id,selected_option").eq("attempt_id", attemptId),
  ]);

  if (!result || !template) notFound();

  const ids = (links ?? []).map((row) => row.question_id);
  const { data: questions } = ids.length
    ? await supabase.from("questions").select("id,subject_id").in("id", ids)
    : { data: [] as Array<{ id: string; subject_id: string | null }> };

  const subjectIds = [...new Set((questions ?? []).map((q) => q.subject_id).filter((id): id is string => Boolean(id)))];
  const { data: subjects } = subjectIds.length
    ? await supabase.from("subjects").select("id,name").in("id", subjectIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const { data: options } = ids.length
    ? await supabase.from("question_options").select("question_id,option_index,is_correct").in("question_id", ids)
    : { data: [] as Array<{ question_id: string; option_index: number; is_correct: boolean }> };

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));
  const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s.name]));
  const answerMap = new Map((answers ?? []).map((a) => [a.question_id, a.selected_option]));
  const correctMap = new Map<string, number>();
  for (const option of options ?? []) if (option.is_correct) correctMap.set(option.question_id, option.option_index);

  const analysis = new Map<string, { total: number; correct: number; incorrect: number; unattempted: number }>();
  for (const link of links ?? []) {
    const question = questionMap.get(link.question_id);
    const key = question?.subject_id ?? "unclassified";
    const current = analysis.get(key) ?? { total: 0, correct: 0, incorrect: 0, unattempted: 0 };
    current.total += 1;
    const selected = answerMap.get(link.question_id);
    const correct = correctMap.get(link.question_id);
    if (selected === undefined || selected === null) current.unattempted += 1;
    else if (selected === correct) current.correct += 1;
    else current.incorrect += 1;
    analysis.set(key, current);
  }

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Performance analysis</p>
          <h1>{template.title}</h1>
          <p className="muted">Subject-wise breakdown · {attempt.language.toUpperCase()}</p>
        </div>
        <div className="button-row">
          <Link className="button" href={"/test/" + attemptId + "/result"}>Result</Link>
          <Link className="button primary" href="/dashboard">Dashboard</Link>
        </div>
      </div>

      <div className="result-grid">
        <div className="result-card primary-result"><span>Score</span><strong>{Number(result.score).toFixed(2)}</strong></div>
        <div className="result-card"><span>Accuracy</span><strong>{Number(result.accuracy).toFixed(1)}%</strong></div>
        <div className="result-card"><span>Attempted</span><strong>{result.correct_count + result.incorrect_count}</strong></div>
        <div className="result-card"><span>Unattempted</span><strong>{result.unattempted_count}</strong></div>
        <div className="result-card"><span>Time</span><strong>{Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s</strong></div>
      </div>

      <section className="panel">
        <h2>Subject analysis</h2>
        <div className="list-stack">
          {[...analysis.entries()].map(([subjectId, stats]) => {
            const accuracy = stats.correct + stats.incorrect > 0
              ? (stats.correct / (stats.correct + stats.incorrect)) * 100
              : 0;
            return (
              <article className="list-row" key={subjectId}>
                <div>
                  <strong>{subjectMap.get(subjectId) ?? "Other"}</strong>
                  <p className="muted">{stats.total} questions · {stats.correct} correct · {stats.incorrect} incorrect · {stats.unattempted} unattempted</p>
                </div>
                <strong>{accuracy.toFixed(1)}%</strong>
              </article>
            );
          })}
          {!analysis.size ? <p className="muted">Subject analysis is not available for this attempt.</p> : null}
        </div>
      </section>
    </main>
  );
}
