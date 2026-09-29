import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabasePublicClient();
  const [{ data: categories }, { data: exams }] = await Promise.all([
    supabase.from("exam_categories").select("id,name,slug,description").eq("is_active", true).order("sort_order"),
    supabase.from("exams").select("id,name,slug,description,category_id").eq("is_active", true).order("name"),
  ]);

  const grouped = (categories ?? []).map((category) => ({
    ...category,
    exams: (exams ?? []).filter((exam) => exam.category_id === category.id),
  })).filter((category) => category.exams.length > 0);
  const uncategorised = (exams ?? []).filter((exam) => !exam.category_id);

  const featuredTests = [
    ["10-Minute Speed Practice", "banking-speed-10m", "Choose 5, 10, 15 or 20 questions for a focused ten-minute session.", "practice", 20, 10],
    ["Banking Quantitative Aptitude Sectional — 50 Questions", "banking-quant-sectional-50", "50-question quantitative aptitude sectional test.", "sectional", 50, 30],
    ["Banking Reasoning Ability Sectional — 50 Questions", "banking-reasoning-sectional-50", "50-question reasoning ability sectional test.", "sectional", 50, 30],
    ["Banking Aptitude Full Mock — 100 Questions", "banking-demo-quick-01", "Full-length banking aptitude mock with 100 questions.", "full_mock", 100, 60],
  ] as const;

  return (
    <main>
      <section className="hero hero-premium">
        <div className="container hero-split">
          <div className="hero-content">
            <div className="eyebrow">A modern mock-test workspace</div>
            <h1>Prepare with purpose. <span>Perform with confidence.</span></h1>
            <p>Find your exam faster, practise by stage and difficulty, and turn every attempt into a useful next step.</p>
            <form className="hero-search" action="/tests" method="get">
              <span className="hero-search-icon" aria-hidden="true">⌕</span>
              <input name="q" type="search" placeholder="Search exams, mock tests or subjects…" aria-label="Search exams, mock tests or subjects" />
              <button type="submit">Search</button>
            </form>
            <div className="actions">
              <Link className="btn btn-primary" href="/exams">Choose an exam</Link>
              <Link className="btn btn-secondary" href="/exams">Explore categories</Link>
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
              <div className="visual-focus"><span>✓</span><div><strong>Ready to improve</strong><small>3 weak topics identified</small></div></div>
            </div>
            <div className="hero-float-card hero-float-one"><span>⚡</span><div><strong>Fast feedback</strong><small>Results in seconds</small></div></div>
            <div className="hero-float-card hero-float-two"><span>✓</span><div><strong>Focused practice</strong><small>Built around your goals</small></div></div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-wide">
          <div><strong>{exams?.length ?? 0}</strong><span>active exam tracks</span></div>
          <div><strong>{grouped.length}</strong><span>preparation categories</span></div>
          <div><strong>2,500+</strong><span>approved live questions</span></div>
          <div><strong>3</strong><span>test languages available</span></div>
        </div>
      </section>

      <section className="section homepage-exam-library">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Exam library</div>
              <h2>Find your exam by category</h2>
              <p>Start with the field you are preparing for, then open the exact exam.</p>
            </div>
            <Link className="button secondary" href="/exams">View full library</Link>
          </div>

          <div className="category-directory">
            {grouped.map((category) => (
              <a className="category-directory-item" href={`#category-${category.slug}`} key={category.id}>
                <span className="category-directory-icon">{category.name.slice(0,1)}</span>
                <span><strong>{category.name}</strong><small>{category.exams.length} exams</small></span>
                <b>↓</b>
              </a>
            ))}
          </div>

          <div className="exam-category-stack">
            {grouped.map((category) => {
              const visibleExams = category.exams.slice(0, 6);
              const remaining = category.exams.length - visibleExams.length;
              return (
                <section className="exam-category-section homepage-category" id={`category-${category.slug}`} key={category.id}>
                  <div className="exam-category-heading">
                    <div>
                      <p className="eyebrow">{category.name}</p>
                      <h2>{category.name} exams</h2>
                      <p>{category.description ?? "Choose an exam to continue into its stages and mock tests."}</p>
                    </div>
                    <Link className="category-view-all" href={`/exams#category-${category.slug}`}>
                      <span>{category.exams.length} exams</span><b>View all →</b>
                    </Link>
                  </div>
                  <div className="grid exam-card-grid">
                    {visibleExams.map((exam, index) => (
                      <Link className="card exam-card" key={exam.id} href={"/exams/" + exam.slug}>
                        <div className="exam-art"><span>{exam.name.split(" ").map((x: string) => x[0]).slice(0,2).join("")}</span><small>{String(index + 1).padStart(2,"0")}</small></div>
                        <div className="eyebrow">{category.name}</div>
                        <h3>{exam.name}</h3>
                        <p>{exam.description ?? "Structured stages, subjects and mock tests."}</p>
                        <span className="card-link">Open exam <b>→</b></span>
                      </Link>
                    ))}
                  </div>
                  {remaining > 0 && (
                    <div className="category-more-row">
                      <span>Showing 6 of {category.exams.length} exams</span>
                      <Link href={`/exams#category-${category.slug}`}>See {remaining} more in {category.name} →</Link>
                    </div>
                  )}
                </section>
              );
            })}
            {!!uncategorised.length && (
              <section className="exam-category-section homepage-category">
                <div className="exam-category-heading"><div><p className="eyebrow">More preparation</p><h2>Other exams</h2></div><span>{uncategorised.length} exams</span></div>
                <div className="grid exam-card-grid">
                  {uncategorised.slice(0,6).map((exam) => <Link className="card exam-card" key={exam.id} href={"/exams/" + exam.slug}><h3>{exam.name}</h3><p>{exam.description ?? "Structured preparation."}</p><span className="card-link">Open exam <b>→</b></span></Link>)}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div><div className="eyebrow">Live practice library</div><h2>Pick a test and start now.</h2><p>Published tests are ready to open from the preparation library.</p></div>
            <Link className="button secondary" href="/tests">See all tests</Link>
          </div>
          <div className="grid">
            {featuredTests.map(([title, slug, description, testType, questionCount, durationMinutes]) => (
              <Link className="card test-card" key={slug} href={"/test/" + slug}>
                <div className="test-card-top"><span className="test-index">LIVE</span><span className="badge">Free to try</span></div>
                <div className="eyebrow">{testType.replace("_"," ")}</div>
                <h3>{title}</h3>
                <p>{description}</p>
                <div className="meta"><span className="badge">{questionCount} questions</span><span className="badge">{durationMinutes} min</span></div>
                <span className="card-link">View test <b>→</b></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section resource-preview-section">
        <div className="container">
          <div className="section-header">
            <div><div className="eyebrow">Preparation resources</div><h2>Know what to do before and after every mock.</h2><p>Short, practical guidance for choosing a test, managing time and turning your result into the next study action.</p></div>
            <Link className="button secondary" href="/resources">Explore resources</Link>
          </div>
          <div className="grid resource-preview-grid">
            <Link className="card" href="/resources"><span className="resource-label">Strategy</span><h3>Build a mock-test routine</h3><p>Choose a timed test, review it properly, then target the weak area.</p><span className="card-link">Read guide →</span></Link>
            <Link className="card" href="/resources"><span className="resource-label">Review</span><h3>Understand your score</h3><p>Use accuracy, time and attempted questions together instead of looking only at marks.</p><span className="card-link">Review guide →</span></Link>
            <Link className="card" href="/resources"><span className="resource-label">Speed</span><h3>Improve pacing</h3><p>Use short speed sessions to practise question selection and time control.</p><span className="card-link">See speed tips →</span></Link>
            <Link className="card" href="/resources"><span className="resource-label">Languages</span><h3>Prepare in your language</h3><p>Supported tests can be taken in English, Hindi or Marathi.</p><span className="card-link">Learn more →</span></Link>
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
          <div><div className="eyebrow">Start today</div><h2>One focused mock can tell you a lot.</h2><p>Pick a test, then begin your preparation session.</p></div>
          <Link className="btn btn-primary" href="/tests">Browse mock tests</Link>
        </div>
      </section>
    </main>
  );
}
