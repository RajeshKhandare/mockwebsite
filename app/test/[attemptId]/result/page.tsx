import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAttemptOwner } from "@/lib/attempt-owner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Test Result | MockTest",
  robots: { index: false, follow: false },
};

export default async function ResultPage(props: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await props.params;
  const owner = await getAttemptOwner();
  if (!owner.userId && !owner.guestToken) notFound();
  const supabase = createSupabaseAdminClient();
  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("id,status,language,test_template_id,started_at,submitted_at,user_id,guest_token")
    .eq("id", attemptId).maybeSingle();

  if (!attempt || (owner.userId ? attempt.user_id !== owner.userId : attempt.guest_token !== owner.guestToken)) notFound();

  const isGuest = !attempt.user_id;
  if (attempt.status !== "submitted") redirect("/test/" + attemptId);

  const [{ data: result }, { data: template }, { data: links }] = await Promise.all([
    supabase.from("results").select("correct_count,incorrect_count,unattempted_count,score,accuracy,time_taken_seconds").eq("attempt_id", attemptId).single(),
    supabase.from("test_templates").select("title,question_count,marks_per_question,negative_marks").eq("id", attempt.test_template_id).single(),
    supabase.from("test_attempt_questions").select("question_id,position").eq("attempt_id", attemptId).order("position"),
  ]);

  if (!result || !template) notFound();

  const ids = (links ?? []).map((row) => row.question_id);
  const admin = supabase;
  const [{ data: questions }, { data: answers }, { data: options }] = await Promise.all([
    ids.length ? admin.from("questions").select("id,question_text,explanation").in("id", ids) : Promise.resolve({data:[]}),
    supabase.from("test_answers").select("question_id,selected_option,marked_for_review").eq("attempt_id", attemptId),
    ids.length ? admin.from("question_options").select("question_id,option_index,option_text,is_correct").in("question_id", ids).order("option_index") : Promise.resolve({data:[]}),
  ]);
  const answerMap = new Map((answers ?? []).map((a) => [a.question_id, a]));
  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));
  const optionMap = new Map<string, typeof options>();
  for (const option of options ?? []) optionMap.set(option.question_id, [...(optionMap.get(option.question_id) ?? []), option]);

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
      {!isGuest ? <section className="panel">
        <h2>Answer review</h2>
        <div className="list-stack">
          {(links ?? []).map((link) => {
            const question = questionMap.get(link.question_id);
            const answer = answerMap.get(link.question_id);
            const questionOptions = optionMap.get(question?.id ?? "") ?? [];
            const correctOption = questionOptions.find((option) => option.is_correct);
            const selectedOption = questionOptions.find((option) => option.option_index === answer?.selected_option);
            const isCorrect = Boolean(correctOption && selectedOption && correctOption.option_index === selectedOption.option_index);
            return question ? <article className="list-row" key={question.id}>
              <div>
                <strong>Q{link.position + 1}. {question.question_text}</strong>
                <p className="muted">{selectedOption ? "Your response: " + selectedOption.option_text : "Not answered"}{answer?.marked_for_review ? " · Marked for review" : ""}</p>
                <p className="muted">{correctOption ? "Correct answer: " + correctOption.option_text : "Correct answer unavailable."} · {selectedOption ? (isCorrect ? "Correct" : "Incorrect") : "Unattempted"}</p>
              </div>
              <small>{question.explanation ?? "No explanation provided."}</small>
            </article> : null;
          })}
        </div>
      </section> : (
        <section className="panel">
          <h2>Basic result shown</h2>
          <p className="muted">This guest result includes a limited performance summary. Sign in to unlock answer review, detailed analysis, history and personalized recommendations.</p>
        </section>
      )}
      <section className="panel">
        <h2>Scoring summary</h2>
        <p className="muted">{template.question_count} questions · +{template.marks_per_question} for correct · −{template.negative_marks} for incorrect.</p>
        <div className="button-row">{!isGuest ? <Link className="button" href={"/test/" + attemptId + "/analysis"}>View analysis</Link> : <Link className="button primary" href={"/test/" + attemptId}>Sign in for full analysis</Link>}<Link className="button primary" href="/tests">Take another test</Link></div>
      </section>
    </main>
  );
}
