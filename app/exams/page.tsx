import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const supabase = createSupabaseAdminClient();
  const [{ data: categories, error: categoriesError }, { data: exams, error: examsError }] = await Promise.all([
    supabase.from("exam_categories").select("id,name,slug,description").eq("is_active", true).order("sort_order"),
    supabase.from("exams").select("id,name,slug,description,category_id").eq("is_active", true).order("name"),
  ]);

  const catalogError = categoriesError || examsError;

  return (
    <main className="section"><div className="container">
      <div className="section-header">
        <div><div className="eyebrow">Exam library</div><h1 style={{fontSize:40}}>Choose an exam</h1><p>Browse active exam configurations, stages, subjects and mock tests.</p></div>
      </div>
      {catalogError ? (
        <div className="card"><h2>Exam catalog temporarily unavailable</h2><p className="muted">The exam catalogue could not be loaded right now. Please try again shortly.</p></div>
      ) : (
        <>
          <div className="grid">
            {(exams ?? []).map((exam) => (
              <article className="card" key={exam.id}>
                <h3>{exam.name}</h3>
                <p>{exam.description ?? "Structured preparation with configurable stages and subjects."}</p>
                <Link className="btn btn-primary" href={`/exams/${exam.slug}`}>Open exam</Link>
              </article>
            ))}
            {!exams?.length && <p className="muted">No active exams are published yet.</p>}
          </div>
          {!!categories?.length && (
            <section className="section">
              <div className="section-header"><div><h2>Exam categories</h2><p>Categories provide a scalable grouping for future exam families.</p></div></div>
              <div className="meta">{categories.map((category) => <span className="badge" key={category.id}>{category.name}</span>)}</div>
            </section>
          )}
        </>
      )}
    </div></main>
  );
}
