import type { Metadata } from "next";
import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Exams & Preparation Categories",
  description: "Choose an exam category, open an exam and move through its stages, subjects and mock tests.",
};

export default async function ExamsPage() {
  const supabase = createSupabasePublicClient();
  const [{ data: categories, error: categoriesError }, { data: exams, error: examsError }] = await Promise.all([
    supabase.from("exam_categories").select("id,name,slug,description").eq("is_active", true).order("sort_order"),
    supabase.from("exams").select("id,name,slug,description,category_id").eq("is_active", true).order("name"),
  ]);
  const catalogError = categoriesError || examsError;
  const grouped = (categories ?? []).map((category) => ({
    ...category,
    exams: (exams ?? []).filter((exam) => exam.category_id === category.id),
  })).filter((category) => category.exams.length > 0);
  const uncategorised = (exams ?? []).filter((exam) => !exam.category_id);

  return (
    <main className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">Preparation library</div>
            <h1>Choose a category, then choose your exam.</h1>
            <p>Keep the journey simple: <strong>Category → Exam → Stage → Subject → Test → Instructions → Start</strong>.</p>
          </div>
          <div className="library-count"><strong>{exams?.length ?? 0}</strong><span>exam tracks</span></div>
        </div>

        {catalogError ? (
          <div className="card"><h2>Exam catalog temporarily unavailable</h2><p className="muted">Please try again shortly.</p></div>
        ) : (
          <div className="exam-category-stack">
            {grouped.map((category) => (
              <section className="exam-category-section" key={category.id}>
                <div className="exam-category-heading">
                  <div><p className="eyebrow">{category.name}</p><h2>{category.name} exams</h2><p>{category.description ?? "Choose an exam to continue into its stages and mock tests."}</p></div>
                  <span>{category.exams.length} exams</span>
                </div>
                <div className="grid exam-card-grid">
                  {category.exams.map((exam, index) => (
                    <Link className="card exam-card" key={exam.id} href={"/exams/" + exam.slug}>
                      <div className="exam-art"><span>{exam.name.split(" ").map((x: string) => x[0]).slice(0,2).join("")}</span><small>{String(index + 1).padStart(2,"0")}</small></div>
                      <h3>{exam.name}</h3>
                      <p>{exam.description ?? "Structured stages, subjects and mock tests."}</p>
                      <span className="card-link">Open exam <b>→</b></span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
            {!!uncategorised.length && (
              <section className="exam-category-section">
                <div className="exam-category-heading"><div><p className="eyebrow">More preparation</p><h2>Other exams</h2></div><span>{uncategorised.length} exams</span></div>
                <div className="grid exam-card-grid">
                  {uncategorised.map((exam) => <Link className="card exam-card" key={exam.id} href={"/exams/" + exam.slug}><h3>{exam.name}</h3><p>{exam.description ?? "Structured preparation."}</p><span className="card-link">Open exam <b>→</b></span></Link>)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
