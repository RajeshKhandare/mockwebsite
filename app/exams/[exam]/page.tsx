import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseRestGet } from "@/lib/supabase/rest";

export const dynamic = "force-dynamic";

type Exam = { id: string; name: string; slug: string; description: string | null };
type Stage = { id: string; slug: string; name: string; description: string | null; sort_order: number };

export default async function ExamPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  let item: Exam;
  let stages: Stage[] = [];

  try {
    item = await supabaseRestGet<Exam>("exams", {
      select: "id,name,slug,description",
      slug: `eq.${exam}`,
      is_active: "eq.true",
      limit: "1",
    }, { single: true });

    stages = await supabaseRestGet<Stage[]>("exam_stages", {
      select: "id,slug,name,description,sort_order",
      exam_id: `eq.${item.id}`,
      order: "sort_order.asc",
    });
  } catch (error) {
    console.error("Exam catalog load failed", error);
    return <main className="section"><div className="container"><div className="card"><h2>Exam temporarily unavailable</h2><p className="muted">We could not load this exam right now. Please try again shortly.</p></div></div></main>;
  }

  if (!item) notFound();

  let firstTest: { slug: string; title: string } | null = null;
  if (stages.length) {
    try {
      const tests = await supabaseRestGet<Array<{slug:string;title:string}>>("test_templates", {
        select: "slug,title",
        exam_stage_id: "in.(" + stages.map((stage) => stage.id).join(",") + ")",
        is_active: "eq.true",
        order: "title.asc",
        limit: "1",
      });
      firstTest = tests[0] ?? null;
    } catch {
      firstTest = null;
    }
  }

  return (
    <main className="section"><div className="container">
      <div className="breadcrumb-row"><Link href="/exams">Exams</Link><span>›</span><strong>{item.name}</strong></div>
      <div className="eyebrow">Exam preparation</div>
      <h1 style={{fontSize:42}}>{item.name}</h1>
      <p style={{maxWidth:720,color:"var(--muted)"}}>{item.description ?? "Structured preparation through configurable stages, subjects and mock tests."}</p>
      <div className="button-row exam-quick-actions">
        {firstTest && <Link className="btn btn-primary" href={"/test/" + firstTest.slug}>Start a mock test</Link>}
        <Link className="btn btn-secondary" href="#stages">Choose a stage</Link>
      </div>
      <div className="catalog-stats">
        <div><strong>{stages.length}</strong><span>Preparation stages</span></div>
        <div><strong>Structured</strong><span>Subject-wise practice</span></div>
        <div><strong>Live</strong><span>Published mock tests</span></div>
      </div>
      <div className="section" id="stages">
        <div className="section-header"><div><h2>Stages</h2><p>Select a configured stage to view its subjects and published mock tests.</p></div></div>
        <div className="grid">
          {stages.map((stage) => (
            <article className="card" key={stage.id}>
              <h3>{stage.name}</h3>
              <p>{stage.description ?? "Stage-specific subjects and mock tests."}</p>
              <Link className="btn btn-primary" href={`/exams/${item.slug}/${stage.slug}`}>View stage</Link>
            </article>
          ))}
          {!stages.length && <p className="muted">No stages are configured for this exam yet.</p>}
        </div>
      </div>
    </div></main>
  );
}
