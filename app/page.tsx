import Link from "next/link";

const exams = [
  { name: "Banking Exams", slug: "banking", desc: "Practice for major banking recruitment stages.", tags: ["Prelims", "Mains", "Sectional"] },
  { name: "SSC Exams", slug: "ssc", desc: "A foundation for SSC-style competitive exam preparation.", tags: ["Tier-based", "Subject Tests"] },
  { name: "Railway Exams", slug: "railways", desc: "Flexible test structures for railway recruitment exams.", tags: ["Practice", "Mock Tests"] },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="eyebrow">Exam preparation platform</div>
          <h1>Prepare with structure. Practice with purpose.</h1>
          <p>Take focused mock tests, review performance, identify weak areas and build exam readiness through a platform designed to grow across exams, subjects and learning formats.</p>
          <div className="actions">
            <Link className="btn btn-primary" href="/exams">Explore exams</Link>
            <Link className="btn btn-secondary" href="/tests">Browse mock tests</Link>
          </div>
          <div className="stats">
            <div className="stat"><strong>3+</strong><span>Exam categories planned</span></div>
            <div className="stat"><strong>3</strong><span>Test languages supported</span></div>
            <div className="stat"><strong>4</strong><span>Core test types</span></div>
            <div className="stat"><strong>1</strong><span>Unified test engine</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div><h2>Explore exam preparation</h2><p>The same core engine can support different exam families and stages.</p></div>
          </div>
          <div className="grid">
            {exams.map((exam) => (
              <article className="card" key={exam.slug}>
                <h3>{exam.name}</h3>
                <p>{exam.desc}</p>
                <div className="meta">{exam.tags.map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div>
                <Link className="btn btn-secondary" href={`/exams/${exam.slug}`}>View exam</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
