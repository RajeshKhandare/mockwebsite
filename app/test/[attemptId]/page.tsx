import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TestAuthBox from "./test-auth-box";
import StartTest from "./start-test";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Test Instructions | MockTest",
  robots: { index: false, follow: false },
};

export default async function TestInstructionsPage({ params, searchParams }: { params: Promise<{ attemptId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { attemptId } = await params;
  const search = await searchParams;
  const error = typeof search.error === "string" ? search.error : "";
  const message = typeof search.message === "string" ? search.message : "";
  const supabase = createSupabasePublicClient();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isTemplateId = uuidPattern.test(attemptId);
  const query = supabase
    .from("test_templates")
    .select("id,slug,title,description,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,requires_login")
    .eq("is_active", true);

  const { data: test, error } = isTemplateId
    ? await query.eq("id", attemptId).maybeSingle()
    : await query.eq("slug", attemptId).maybeSingle();

  if (error) {
    console.error("Test template load failed", error);
    return <main className="section"><div className="container"><div className="card"><h2>Test unavailable</h2><p className="muted">This test could not be loaded right now. Please try again shortly.</p></div></div></main>;
  }
  if (!test) notFound();

  const serverSupabase = await createSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();

  return (
    <main className="section"><div className="container" style={{maxWidth:820}}>
      <div className="eyebrow">Test instructions</div>
      <h1 style={{fontSize:42}}>{test.title}</h1>
      <div className="card">
        <p className="muted">{test.description}</p>
        <h3>Before you begin</h3>
        <ul style={{lineHeight:1.9,color:"var(--muted)"}}>
          <li>Choose the language for this test: English, Hindi or Marathi when available.</li>
          <li>Your attempt is saved to your account as you answer.</li>
          <li>Scoring is performed on the server after submission.</li>
          <li>Do not refresh or close the test window unnecessarily during an active attempt.</li>
        </ul>
        <div className="meta">
          <span className="badge">{test.question_count} questions</span>
          <span className="badge">{Math.round(test.duration_seconds / 60)} minutes</span>
          <span className="badge">{test.question_count * Number(test.marks_per_question)} marks</span>
          <span className="badge">−{test.negative_marks} negative</span>
        </div>
        {test.requires_login && !user ? (
          <TestAuthBox nextPath={"/test/" + attemptId} error={error} message={message} />
        ) : !test.requires_login ? (
          <TestAuthBox nextPath={"/test/" + attemptId} error={error} message={message} />
        ) : null}
        <StartTest testTemplateId={test.id} languages={test.supported_languages} requiresLogin={test.requires_login} loggedIn={Boolean(user)} />
      </div>
    </div></main>
  );
}
