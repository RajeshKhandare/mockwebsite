import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const supabase = createSupabasePublicClient();
  const [{ data: categories, error: categoriesError }, { data: exams, error: examsError }] = await Promise.all([
    supabase.from("exam_categories").select("id,name,slug,description").eq("is_active", true).order("sort_order"),
    supabase.from("exams").select("id,name,slug,description,category_id").eq("is_active", true).order("name"),
  ]);
  const catalogError = categoriesError || examsError;
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return (
    <main className="section"><div className="container">
      <div className="section-header">
        <div><div className="eyebrow">Exam library</div><h1 style={{fontSize:42}}>Find your exam.</h1><p>Browse preparation tracks across banking, SSC, railways, teaching, civil services, defence, engineering and more.</p></div>
        <div className="library-count"><strong>{exams?.length ?? 0}</strong><span>exam tracks</span></div>
      </div>
      {catalogError ? (
        <div className="card"><h2>Exam catalog temporarily unavailable</h2><p className="muted">Please try again shortly.</p></div>
      ) : (
        <>
          <div className="grid exam-card-grid">
            {(exams ?? []).map((exam, index) => (
              <Link className="card exam-card" key={exam.id} href={`/exams/${exam.slug}`}>
                <div className="exam-art"><span>{exam.name.split(" ").map((x) => x[0]).slice(0,2).join("")}</span><small>{String(index + 1).padStart(2,"0")}</small></div>
                <div className="eyebrow">{categoryMap.get(exam.category_id ?? "") ?? "Exam track"}</div>
                <h3>{exam.name}</h3>
                <p>{exam.description ?? "Structured preparation with configurable stages and mock tests."}</p>
                <span className="card-link">Open exam <b>→</b></span>
              </Link>
            ))}
          </div>
          {!!categories?.length && (
            <section className="section" style={{paddingBottom:10}}>
              <div className="section-header"><div><div className="eyebrow">Preparation families</div><h2>Explore by category</h2></div></div>
              <div className="category-pills">{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div>
            </section>
          )}
        </>
      )}
    </div></main>
  );
}
