import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const fallbackExams = [
  ["Banking", "SBI PO · IBPS PO", "Banking & Insurance"],
  ["SSC", "CGL · CHSL", "SSC"],
  ["Railways", "NTPC · Group D", "Railways"],
  ["Teaching", "CTET", "Teaching"],
  ["Civil Services", "UPSC CSE", "Civil Services"],
  ["Defence", "CDS · NDA", "Defence"],
];

export default async function HomePage() {
  const supabase = createSupabasePublicClient();
  const [{ data: exams }, { data: stats }] = await Promise.all([
    supabase.from("exams").select("id,name,slug,description,category_id").eq("is_active", true).order("name").limit(12),
    supabase.rpc("get_platform_stats"),
  ]);
  const platform = (stats ?? {}) as { exam_tracks?: number; published_mocks?: number; approved_questions?: number; completed_attempts?: number; unique_students?: number };
  const featured = (exams ?? []).slice(0, 6);

  return (
    <main>
      <section className="hero hero-premium">
        <div className="container hero-split">
          <div className="hero-content">
            <div className="eyebrow">A modern mock-test workspace</div>
            <h1>Prepare with purpose. <span>Perform with confidence.</span></h1>
            <p>Timed mock tests, focused practice and meaningful performance insights — organised around the way serious aspirants actually prepare.</p>
            <div className="actions">
              <Link className="btn btn-primary" href="/tests">Explore mock tests</Link>
              <Link className="btn btn-secondary" href="/exams">Explore exams</Link>
            </div>
            <div className="hero-proof">
              <span>English · Hindi · Marathi</span><span>Server-scored</span><span>Exam-style interface</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Mock test dashboard preview">
            <div className="visual-window">
              <div className="visual-top"><span className="visual-dot"/><span className="visual-dot"/><span className="visual-dot"/><strong>Performance overview</strong></div>
              <div className="visual-score"><div><small>Latest mock</small><strong>78%</strong><span>Accuracy</span></div><div className="mini-ring">↑ 12%</div></div>
              <div className="visual-bars"><i style={{height:"58%"}}/><i style={{height:"76%"}}/><i style={{height:"43%"}}/><i style={{height:"88%"}}/><i style={{height:"68%"}}/></div>
              <div className="visual-list"><span>Quantitative Aptitude</span><b>84%</b><span>Reasoning</span><b>72%</b><span>Time efficiency</span><b>91%</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-wide">
          <div><strong>{platform.exam_tracks ?? 0}+</strong><span>exam tracks in the library</span></div>
          <div><strong>{platform.published_mocks ?? 0}</strong><span>published mock tests</span></div>
          <div><strong>{platform.approved_questions ?? 0}</strong><span>approved practice questions</span></div>
          <div><strong>3</strong><span>test languages available</span></div>
          {Number(platform.unique_students ?? 0) > 0 && <div><strong>{platform.unique_students}</strong><span>students with completed attempts</span></div>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div><div className="eyebrow">Exam library</div><h2>Choose your preparation track</h2><p>Start with an exam, then move into its stage, subjects and available tests.</p></div>
            <Link className="button secondary" href="/exams">View full library</Link>
          </div>
          <div className="grid exam-card-grid">
            {(featured.length ? featured : fallbackExams.map(([name,desc,cat]) => ({id:name,name,slug:"",description:desc,category_id:cat}))).map((exam: any, index: number) => (
              <Link className="card exam-card" key={exam.id} href={exam.slug ? `/exams/${exam.slug}` : "/exams"}>
                <div className="exam-art"><span>{String(exam.name).split(" ").map((x:string)=>x[0]).slice(0,2).join("")}</span><small>{String(index + 1).padStart(2,"0")}</small></div>
                <div className="eyebrow">Exam track</div>
                <h3>{exam.name}</h3>
                <p>{exam.description ?? "Structured practice with configurable stages and mock tests."}</p>
                <span className="card-link">Explore track <b>→</b></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section feature-section">
        <div className="container feature-layout">
          <div>
            <div className="eyebrow">Built around the attempt</div>
            <h2>Everything important happens after you click Start.</h2>
            <p className="muted">The platform is designed to make the test itself feel familiar, then turn the attempt into useful next steps.</p>
          </div>
          <div className="feature-stack">
            <article><span>01</span><div><h3>Real exam rhythm</h3><p>Timer, question palette, review marking and clear navigation keep the interface focused.</p></div></article>
            <article><span>02</span><div><h3>Instant clarity</h3><p>Results surface score, accuracy, attempted questions, time and answer-level review.</p></div></article>
            <article><span>03</span><div><h3>Long-term progress</h3><p>Signed-in students can build a history of attempts and detailed subject performance over time.</p></div></article>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container cta-panel">
          <div><div className="eyebrow">Start today</div><h2>One focused mock can tell you a lot.</h2><p>Pick a test, choose English, Hindi or Marathi, and begin.</p></div>
          <Link className="btn btn-primary" href="/tests">Browse mock tests</Link>
        </div>
      </section>
    </main>
  );
}
