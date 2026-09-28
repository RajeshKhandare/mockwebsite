import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseRestGet } from "@/lib/supabase/rest";
import StartTest from "./start-test";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Test Instructions | MockTest",
  robots: { index: false, follow: false },
};

type TestTemplate = {
  id: string; slug: string; title: string; description: string | null;
  question_count: number; duration_seconds: number; marks_per_question: number;
  negative_marks: number; supported_languages: string[]; requires_login: boolean;
};

export default async function TestInstructionsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const legacySlug = attemptId === "banking-10-minute-challenge-01" ? "banking-speed-10m" : attemptId;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let test: TestTemplate | null = null;
  try {
    const filters: Record<string, string> = {
      select: "id,slug,title,description,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,requires_login",
      is_active: "eq.true", limit: "1",
    };
    if (uuidPattern.test(legacySlug)) filters.id = "eq." + legacySlug;
    else filters.slug = "eq." + legacySlug;
    const rows = await supabaseRestGet<TestTemplate[]>("test_templates", filters);
    test = rows[0] ?? null;
  } catch (error) {
    console.error("Test template load failed", error);
    return <main className="section"><div className="container"><div className="card"><h2>Test temporarily unavailable</h2><p className="muted">We could not load this test right now. Please try again shortly.</p></div></div></main>;
  }
  if (!test) notFound();
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
  return (
    <main className="section"><div className="container" style={{ maxWidth: 820 }}>
      <div className="eyebrow">Test instructions</div>
      <h1 style={{ fontSize: 42 }}>{test.title}</h1>
      <div className="card">
        <p className="muted">{test.description}</p>
        <h3>Before you begin</h3>
        <ul style={{ lineHeight: 1.9, color: "var(--muted)" }}>
          <li>Choose the language for this test: English, Hindi or Marathi when available.</li>
          <li>Your answers are saved securely during the test. After submission, you can create an account or log in to keep the result and unlock full analysis.</li>
          <li>Scoring is performed on the server after submission.</li>
          <li>Do not refresh or close the test window unnecessarily during an active attempt.</li>
        </ul>
        <div className="meta"><span className="badge">{test.requires_login ? "Account required" : "Free to try"}</span><span className="badge">{test.question_count} questions</span><span className="badge">{Math.round(test.duration_seconds / 60)} minutes</span><span className="badge">{test.question_count * Number(test.marks_per_question)} marks</span><span className="badge">−{test.negative_marks} negative</span></div>
        <StartTest testTemplateId={test.id} languages={test.supported_languages} requiresLogin={test.requires_login} loggedIn={hasAuthCookie} durationSeconds={test.duration_seconds} questionCount={test.question_count} />
      </div>
    </div></main>
  );
}