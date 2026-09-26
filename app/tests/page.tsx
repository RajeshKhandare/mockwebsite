import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const supabase = createSupabasePublicClient();
  const { data: tests, error } = await supabase
    .from("test_templates")
    .select("id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,requires_login")
    .eq("is_active", true)
    .order("title");

  return (
    <main className="section"><div className="container">
      <div className="section-header">
        <div><div className="eyebrow">Mock tests</div><h1 style={{fontSize:42}}>Practice. Review. Improve.</h1><p>Full mocks, focused practice and short challenges with English, Hindi and Marathi support where configured.</p></div>
        <div className="library-count"><strong>{tests?.length ?? 0}</strong><span>published tests</span></div>
      </div>
      {error ? (
        <div className="card"><h2>Mock-test catalogue temporarily unavailable</h2><p className="muted">Please try again shortly.</p></div>
      ) : (
        <div className="grid test-card-grid">
          {(tests ?? []).map((test, index) => (
            <article className="card test-card" key={test.id}>
              <div className="test-card-top"><span className="test-index">{String(index + 1).padStart(2,"0")}</span><span className="badge">{test.requires_login ? "Account" : "Free to try"}</span></div>
              <div className="eyebrow">{test.test_type.replace("_"," ")}</div>
              <h3>{test.title}</h3>
              <p>{test.description}</p>
              <div className="meta">
                <span className="badge">{test.question_count} questions</span>
                <span className="badge">{Math.round(test.duration_seconds / 60)} min</span>
                <span className="badge">{test.question_count * Number(test.marks_per_question)} marks</span>
                <span className="badge">−{test.negative_marks}</span>
              </div>
              <div className="test-card-footer"><span>{test.supported_languages.map((l: string) => l.toUpperCase()).join(" · ")}</span><Link className="btn btn-primary" href={"/test/" + (test.slug ?? test.id)}>View test</Link></div>
            </article>
          ))}
          {!tests?.length && <p className="muted">No active mock tests are published yet.</p>}
        </div>
      )}
    </div></main>
  );
}
