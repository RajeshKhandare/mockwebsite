import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const supabase = createSupabasePublicClient();
  const { data: tests, error } = await supabase
    .from("test_templates")
    .select("id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages")
    .eq("is_active", true)
    .order("title");

  return (
    <main className="section"><div className="container">
      <div className="eyebrow">Mock tests</div>
      <h1 style={{fontSize:42}}>Practice in exam conditions</h1>
      <p style={{maxWidth:720,color:"var(--muted)"}}>Choose a test, read the instructions and select your preferred test language before starting.</p>
      {error ? (
        <div className="card" style={{marginTop:28}}><h2>Mock-test catalogue temporarily unavailable</h2><p className="muted">The mock-test catalogue could not be loaded right now. Please try again shortly.</p></div>
      ) : (
        <div className="grid" style={{marginTop:28}}>
          {(tests ?? []).map((test) => (
            <article className="card" key={test.id}>
              <div className="eyebrow">{test.test_type.replace("_"," ")}</div>
              <h3>{test.title}</h3>
              <p>{test.description}</p>
              <div className="meta">
                <span className="badge">{test.question_count} questions</span>
                <span className="badge">{Math.round(test.duration_seconds / 60)} min</span>
                <span className="badge">{test.question_count * Number(test.marks_per_question)} marks</span>
              </div>
              <p className="muted">Languages: {test.supported_languages.map((l: string) => l.toUpperCase()).join(" · ")}</p>
              <Link className="btn btn-primary" href={"/test/" + (test.slug ?? test.id)}>View instructions</Link>
            </article>
          ))}
          {!tests?.length && <p className="muted">No active mock tests are published yet.</p>}
        </div>
      )}
    </div></main>
  );
}
