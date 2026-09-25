import Link from "next/link";

const exams = [
  { slug: "banking", name: "Banking Exams", description: "Configurable preparation for banking recruitment examinations.", stages: ["Prelims", "Mains"] },
  { slug: "ssc", name: "SSC Exams", description: "A scalable home for SSC exam stages and subject-wise tests.", stages: ["Tier I", "Tier II"] },
  { slug: "railways", name: "Railway Exams", description: "Mock tests and practice organized around railway exam patterns.", stages: ["CBT", "Subject Tests"] },
];

export default function ExamsPage() {
  return <main className="section"><div className="container">
    <div className="section-header"><div><div className="eyebrow">Exam library</div><h1 style={{fontSize: 40}}>Choose an exam</h1><p>Exam, stage, subject and topic are data-driven so new categories can be added without changing the test engine.</p></div></div>
    <div className="grid">{exams.map((exam) => <article className="card" key={exam.slug}><h3>{exam.name}</h3><p>{exam.description}</p><div className="meta">{exam.stages.map((stage) => <span className="badge" key={stage}>{stage}</span>)}</div><Link className="btn btn-primary" href={`/exams/${exam.slug}`}>Open exam</Link></article>)}</div>
  </div></main>;
}
