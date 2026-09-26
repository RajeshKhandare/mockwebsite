import Link from "next/link";

const exams = [
  { name: "Banking", slug: "banking-demo", desc: "Structured practice for aptitude, reasoning and exam-stage preparation.", tags: ["Prelims", "Mains", "Sectional"] },
  { name: "SSC", slug: "", desc: "A scalable foundation for tier-based competitive exam preparation.", tags: ["Tier Tests", "Subjects"] },
  { name: "Railways", slug: "", desc: "Exam-style practice with configurable subjects, stages and test patterns.", tags: ["Practice", "Mocks"] },
];

const features = [
  ["Exam-like practice", "Timed tests, question navigation and review controls designed around real computer-based exams."],
  ["Actionable analysis", "Turn every attempt into clear signals around accuracy, speed, subjects and weak areas."],
  ["Built to personalize", "Optional profile details let the platform surface more relevant tests, articles and study resources."],
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
          <div className="eyebrow">Structured exam preparation</div>
          <h1>Practice like the exam. Learn from every attempt.</h1>
          <p>MockTest brings exam-style tests, focused practice and performance insights into one clean preparation workspace — built to expand across competitive and entrance exams.</p>
          <div className="actions">
            <Link className="btn btn-primary" href="/tests">Explore mock tests</Link>
            <Link className="btn btn-secondary" href="/exams">Browse exams</Link>
          </div>
          <div className="stats">
            <div className="stat"><strong>Free</strong><span>Start with selected tests</span></div>
            <div className="stat"><strong>3</strong><span>Test languages: EN · HI · MR</span></div>
            <div className="stat"><strong>Secure</strong><span>Server-side scoring</span></div>
            <div className="stat"><strong>Focused</strong><span>Practice → review → improve</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div><div className="eyebrow">Preparation library</div><h2>Start with your exam</h2><p>Explore an exam family, then move from stage to subject to the right test.</p></div>
            <Link className="button secondary" href="/exams">View all exams</Link>
          </div>
          <div className="grid">
            {exams.map((exam) => (
              <article className="card" key={exam.name}>
                <div className="eyebrow">{exam.name}</div>
                <h3>{exam.name} exam preparation</h3>
                <p>{exam.desc}</p>
                <div className="meta">{exam.tags.map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div>
                <Link className="btn btn-secondary" href={exam.slug ? `/exams/${exam.slug}` : "/exams"}>{exam.slug ? "Explore exam" : "Coming through exam library"}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop:10}}>
        <div className="container">
          <div className="section-header"><div><div className="eyebrow">Why the platform is structured this way</div><h2>Every attempt should teach you something.</h2></div></div>
          <div className="grid">
            {features.map(([title, desc]) => <article className="card" key={title}><h3>{title}</h3><p>{desc}</p></article>)}
          </div>
        </div>
      </section>
    </main>
  );
}
