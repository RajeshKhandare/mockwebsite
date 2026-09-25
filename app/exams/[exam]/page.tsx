import Link from "next/link";
import { notFound } from "next/navigation";

const catalog: Record<string, { name: string; description: string; stages: string[]; subjects: string[] }> = {
  banking: { name: "Banking Exams", description: "Build preparation through configurable stages, subjects and mock tests.", stages: ["Prelims", "Mains"], subjects: ["Quantitative Aptitude", "Reasoning", "English"] },
  ssc: { name: "SSC Exams", description: "A scalable exam area for tier-based preparation and subject practice.", stages: ["Tier I", "Tier II"], subjects: ["Quantitative Aptitude", "Reasoning", "English"] },
  railways: { name: "Railway Exams", description: "Structured practice for railway recruitment examinations.", stages: ["CBT", "Subject Tests"], subjects: ["Mathematics", "General Intelligence", "General Awareness"] },
};

export default async function ExamPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  const item = catalog[exam];
  if (!item) notFound();
  return <main className="section"><div className="container">
    <div className="eyebrow">Exam</div><h1 style={{fontSize: 42}}>{item.name}</h1><p style={{maxWidth:720,color:"var(--muted)"}}>{item.description}</p>
    <div className="section"><div className="section-header"><div><h2>Stages</h2><p>Select the stage before choosing a test.</p></div></div><div className="grid">{item.stages.map((stage) => <article className="card" key={stage}><h3>{stage}</h3><p>View stage-specific subjects and mock tests.</p><Link className="btn btn-primary" href={`/exams/${exam}/${stage.toLowerCase().replaceAll(" ","-")}`}>View stage</Link></article>)}</div></div>
    <div className="section"><div className="section-header"><div><h2>Subjects</h2><p>Subject and topic tests use the same reusable question pool.</p></div></div><div className="grid">{item.subjects.map((subject) => <article className="card" key={subject}><h3>{subject}</h3><p>Practice questions, sectional tests and topic-level analysis.</p><Link className="btn btn-secondary" href="/tests">View tests</Link></article>)}</div></div>
  </div></main>;
}
