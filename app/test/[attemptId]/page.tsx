import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseRestGet } from "@/lib/supabase/rest";
import StartTest from "./start-test";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mock Test | MockTest",
  robots: { index: false, follow: false },
};

type TestTemplate = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  question_count: number;
  duration_seconds: number;
  marks_per_question: number;
  negative_marks: number;
  supported_languages: string[];
  requires_login: boolean;
};

const LEGACY_SLUGS: Record<string, string> = {
  "banking-10-minute-challenge-01": "banking-speed-10m",
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes} min`;
}

function languageName(language: string) {
  return language === "en" ? "English" : language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : language.toUpperCase();
}

export default async function TestInstructionsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const lookup = LEGACY_SLUGS[attemptId] ?? attemptId;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  let test: TestTemplate | null = null;

  try {
    const filters: Record<string, string> = {
      select:
        "id,slug,title,description,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,requires_login",
      is_active: "eq.true",
      limit: "1",
    };

    if (uuidPattern.test(lookup)) filters.id = `eq.${lookup}`;
    else filters.slug = `eq.${lookup}`;

    const rows = await supabaseRestGet<TestTemplate[]>("test_templates", filters);
    test = rows[0] ?? null;
  } catch (error) {
    console.error("Test template load failed", error);
    return (
      <main className="test-launch-page">
        <div className="test-launch-backdrop" />
        <div className="container test-launch-container">
          <div className="test-launch-error">
            <span className="test-launch-kicker">MOCK TEST</span>
            <h1>We couldn't load this test.</h1>
            <p>
              The test service is temporarily unavailable. Please return to the
              test library and try again.
            </p>
            <Link className="btn btn-primary" href="/tests">
              Back to mock tests
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!test) notFound();

  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));

  const totalMarks = test.question_count * Number(test.marks_per_question);
  const languages = test.supported_languages.map(languageName);

  return (
    <main className="test-launch-page">
      <div className="test-launch-backdrop" aria-hidden="true" />
      <div className="container test-launch-container">
        <div className="test-launch-topbar">
          <Link href="/tests" className="test-launch-back">
            ← All mock tests
          </Link>
          <span className="test-launch-status">LIVE TEST LIBRARY</span>
        </div>

        <section className="test-launch-hero">
          <div className="test-launch-copy">
            <span className="test-launch-kicker">READY WHEN YOU ARE</span>
            <h1>{test.title}</h1>
            <p>{test.description}</p>

            <div className="test-launch-metrics" aria-label="Test details">
              <div>
                <strong>{test.question_count}</strong>
                <span>Questions</span>
              </div>
              <div>
                <strong>{formatDuration(test.duration_seconds)}</strong>
                <span>Time limit</span>
              </div>
              <div>
                <strong>{totalMarks}</strong>
                <span>Total marks</span>
              </div>
              <div>
                <strong>−{test.negative_marks}</strong>
                <span>Negative / Q</span>
              </div>
            </div>
          </div>

          <div className="test-launch-panel">
            <div className="test-launch-panel-glow" />
            <span className="test-launch-panel-label">START YOUR SESSION</span>
            <h2>Set your preferences</h2>
            <p>
              Choose your language and question count, then begin a timed
              session with server-side scoring.
            </p>

            <div className="test-launch-chips">
              <span>{test.requires_login ? "Account required" : "Free to try"}</span>
              <span>{languages.join(" · ")}</span>
              <span>Secure scoring</span>
            </div>

            <StartTest
              testTemplateId={test.id}
              languages={test.supported_languages}
              requiresLogin={test.requires_login}
              loggedIn={hasAuthCookie}
              durationSeconds={test.duration_seconds}
              questionCount={test.question_count}
            />
          </div>
        </section>

        <section className="test-launch-info">
          <div>
            <span className="test-launch-kicker">BEFORE YOU BEGIN</span>
            <h2>A focused session, then a useful review.</h2>
          </div>
          <div className="test-launch-info-grid">
            <article>
              <strong>01 · Choose</strong>
              <p>Select the supported language and, for speed practice, the number of questions.</p>
            </article>
            <article>
              <strong>02 · Attempt</strong>
              <p>Your answers are saved during the session and the authoritative clock is server-backed.</p>
            </article>
            <article>
              <strong>03 · Submit</strong>
              <p>Scoring is calculated on the server so the result does not depend on the browser.</p>
            </article>
            <article>
              <strong>04 · Review</strong>
              <p>Use your result and analysis to decide what to practise next.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
