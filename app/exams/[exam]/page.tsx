import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: item, error: itemError } = await supabase
    .from("exams")
    .select("id,name,slug,description")
    .eq("slug", exam)
    .eq("is_active", true)
    .maybeSingle();

  if (itemError) return <main className="section"><div className="container"><div className="card"><h2>Exam unavailable</h2><p className="muted">This exam could not be loaded right now. Please try again shortly.</p></div></div></main>;
  if (!item) notFound();

  const { data: stages, error: stagesError } = await supabase
    .from("exam_stages")
    .select("id,slug,name,description,sort_order")
    .eq("exam_id", item.id)
    .order("sort_order");

  return (
    <main className="section"><div className="container">
      <div className="eyebrow">Exam</div>
      <h1 style={{fontSize:42}}>{item.name}</h1>
      <p style={{maxWidth:720,color:"var(--muted)"}}>{item.description ?? "Structured preparation through configurable stages, subjects and mock tests."}</p>
      <div className="section">
        <div className="section-header"><div><h2>Stages</h2><p>Select a configured stage to view its subjects and published mock tests.</p></div></div>
        {stagesError ? <div className="card"><p className="muted">Stages could not be loaded right now.</p></div> : (
          <div className="grid">
            {(stages ?? []).map((stage) => (
              <article className="card" key={stage.id}>
                <h3>{stage.name}</h3>
                <p>{stage.description ?? "Stage-specific subjects and mock tests."}</p>
                <Link className="btn btn-primary" href={`/exams/${item.slug}/${stage.slug}`}>View stage</Link>
              </article>
            ))}
            {!stages?.length && <p className="muted">No stages are configured for this exam yet.</p>}
          </div>
        )}
      </div>
    </div></main>
  );
}
