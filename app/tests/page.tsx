import Link from "next/link";

const tests = [
  { id: "banking-prelims-01", title: "Banking Prelims Full Mock", exam: "Banking Exams", type: "Full Mock", questions: 100, duration: "60 min", marks: "100" },
  { id: "reasoning-sectional-01", title: "Reasoning Sectional Test", exam: "Banking Exams", type: "Sectional", questions: 35, duration: "20 min", marks: "35" },
  { id: "quant-practice-01", title: "Quantitative Aptitude Practice", exam: "Multiple Exams", type: "Subject Test", questions: 30, duration: "25 min", marks: "30" },
];

export default function TestsPage() {
  return <main className="section"><div className="container">
    <div className="eyebrow">Mock tests</div><h1 style={{fontSize:42}}>Practice in exam conditions</h1><p style={{maxWidth:720,color:"var(--muted)"}}>Every test card exposes the information students need before starting: exam, type, question count, duration and marks.</p>
    <div className="grid" style={{marginTop:28}}>{tests.map((test) => <article className="card" key={test.id}><div className="eyebrow">{test.type}</div><h3>{test.title}</h3><p>{test.exam}</p><div className="meta"><span className="badge">{test.questions} questions</span><span className="badge">{test.duration}</span><span className="badge">{test.marks} marks</span></div><Link className="btn btn-primary" href={`/test/${test.id}`}>View instructions</Link></article>)}</div>
  </div></main>;
}
