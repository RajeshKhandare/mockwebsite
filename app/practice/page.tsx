import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Practice | MockTest",
  description: "Build exam readiness with structured practice by subject and topic.",
};

export default async function PracticePage() {
  const supabase = await createSupabaseServerClient();
  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("id,name,slug")
    .order("name")
    .limit(24);

  return (
    <main className="section">
      <div className="container">
        <div className="eyebrow">Practice</div>
        <h1 style={{fontSize:42}}>Practice by subject and topic</h1>
        <p style={{maxWidth:720,color:"var(--muted)"}}>
          Move from full mock tests to focused preparation when you want to strengthen a specific area.
        </p>
        {error ? (
          <div className="card" style={{marginTop:28}}><h2>Practice library temporarily unavailable</h2><p className="muted">The subject catalogue could not be loaded right now.</p></div>
        ) : (
          <div className="grid" style={{marginTop:28}}>
            {(subjects ?? []).map((subject) => (
              <article className="card" key={subject.id}>
                <h3>{subject.name}</h3>
                <p>Open the configured subject path to see available topics and practice coverage.</p>
                <Link className="btn btn-secondary" href="/exams">Browse exam subjects</Link>
              </article>
            ))}
            {!subjects?.length && (
              <article className="card">
                <h3>Practice library</h3>
                <p>Subjects will appear here as exam configurations are published.</p>
                <Link className="btn btn-primary" href="/exams">Browse exams</Link>
              </article>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
