import Link from "next/link";

const featuredExams = [
  ["Banking Aptitude Demo", "banking-demo", "A small original mock-test dataset used to verify the complete test flow."],
  ["CDS", "cds", "Combined Defence Services preparation."],
  ["CTET", "ctet", "Central Teacher Eligibility Test preparation."],
  ["CUET UG", "cuet-ug", "Common University Entrance Test preparation."],
  ["GATE CSE", "gate-cse", "Computer Science engineering entrance preparation."],
  ["IBPS PO", "ibps-po", "Probationary Officer practice and mock-test preparation."],
  ["JEE Main", "jee-main", "Engineering entrance preparation."],
  ["Judiciary", "judiciary", "State judiciary and judicial services preparation."],
  ["NDA", "nda", "National Defence Academy and Naval Academy preparation."],
  ["NEET UG", "neet-ug", "Medical entrance preparation."],
  ["Police Constable", "police-constable", "General police recruitment preparation."],
  ["RBI Grade B", "rbi-grade-b", "Reserve Bank Grade B preparation."],
] as const;

const featuredTests = [
  ["Banking 10-Minute Challenge", "banking-10-minute-challenge-01", "A fast ten-question challenge.", "practice", 10, 10],
  ["Banking Accuracy Builder", "banking-accuracy-builder-01", "Practice set focused on careful, accurate solving.", "practice", 5, 7],
  ["Banking Aptitude Quick Mock", "banking-demo-quick-01", "Five original questions for verifying the complete mock-test workflow.", "full_mock", 5, 10],
] as const;

export default function HomePage() {
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
          <div><strong>20+</strong><span>exam tracks in the library</span></div>
          <div><strong>5</strong><span>published mock tests</span></div>
          <div><strong>15</strong><span>approved practice questions</span></div>
          <div><strong>3</strong><span>test languages available</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div><div className="eyebrow">Exam library</div><h2>Choose your preparation track</h2><p>Start with an exam, then move into its stage, subjects and available tests.</p></div>
            <Link className="button secondary" href="/exams">View full library</Link>
          </div>
          <div className="grid exam-card-grid">
            {featuredExams.slice(0, 6).map(([name, slug, description], index) => (
              <Link className="card exam-card" key={slug} href={`/exams/${slug}`}>
                <div className="exam-art"><span>{name.split(" ").map((x) => x[0]).slice(0,2).join("")}</span><small>{String(index + 1).padStart(2,"0")}</small></div>
                <div className="eyebrow">Exam track</div>
                <h3>{name}</h3>
                <p>{description}</p>
                <span className="card-link">Explore track <b>→</b></span>
              </Link>
            ))}
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
              <Link className="card test-card" key={slug} href={`/test/${slug}`}>
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
