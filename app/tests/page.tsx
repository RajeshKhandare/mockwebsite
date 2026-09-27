import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function TestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const q = typeof search.q === "string" ? search.q.trim() : "";
  const type = typeof search.type === "string" ? search.type : "all";
  const supabase = createSupabasePublicClient();
  const { data: tests, error } = await supabase
    .from("test_templates")
    .select("id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,requires_login,exam_stages(name,slug,exams(name,slug))")
    .eq("is_active", true)
    .order("title");
  const allTests = tests ?? [];
  const filteredTests = allTests.filter((test) => {
    const stage = (Array.isArray(test.exam_stages) ? test.exam_stages[0] : test.exam_stages) as { name?: string; exams?: { name?: string; slug?: string } | Array<{ name?: string; slug?: string }> } | null;
    const exam = stage?.exams;
    const examName = Array.isArray(exam) ? exam[0]?.name : exam?.name;
    const haystack = [test.title, test.description, test.test_type, stage?.name, examName].filter(Boolean).join(" ").toLowerCase();
    return (type === "all" || test.test_type === type) && (!q || haystack.includes(q.toLowerCase()));
  });
  const types = Array.from(new Set(allTests.map((test) => test.test_type)));

  return (
    <main className="section"><div className="container">
      <div className="section-header">
        <div><div className="eyebrow">Mock tests</div><h1 style={{fontSize:42}}>Practice. Review. Improve.</h1><p>Choose a full mock, sectional test or focused practice set. Every test shows its exam and stage context before you start.</p></div>
        <div className="library-count"><strong>{filteredTests.length}</strong><span>tests shown</span></div>
      </div>
      <form className="test-filter-bar" method="get">
        <input name="q" defaultValue={q} placeholder="Search tests or exams…" aria-label="Search mock tests" />
        <select name="type" defaultValue={type} aria-label="Filter by test type">
          <option value="all">All test types</option>
          {types.map((value) => <option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Filter</button>
        {(q || type !== "all") && <Link className="btn btn-secondary" href="/tests">Clear</Link>}
      </form>
      <div className="test-filter-pills">
        <Link className={type === "all" ? "active" : ""} href={q ? "/tests?q=" + encodeURIComponent(q) : "/tests"}>All</Link>
        {types.map((value) => <Link key={value} className={type === value ? "active" : ""} href={"/tests?type=" + encodeURIComponent(value) + (q ? "&q=" + encodeURIComponent(q) : "")}>{value.replaceAll("_"," ")}</Link>)}
      </div>
      {error ? (
        <div className="card"><h2>Mock-test catalogue temporarily unavailable</h2><p className="muted">Please try again shortly.</p></div>
      ) : (
        <div className="grid test-card-grid">
          {filteredTests.map((test, index) => (
            <article className="card test-card" key={test.id}>
              <div className="test-card-top"><span className="test-index">{String(index + 1).padStart(2,"0")}</span><span className="badge">{test.requires_login ? "Account" : "Free to try"}</span></div>
              <div className="eyebrow">{test.test_type.replace("_"," ")}</div>
              <h3>{test.title}</h3>
              {(() => {
                const stage = (Array.isArray(test.exam_stages) ? test.exam_stages[0] : test.exam_stages) as { name?: string; exams?: { name?: string; slug?: string } | Array<{ name?: string; slug?: string }> } | null;
                const exam = stage?.exams;
                const examName = Array.isArray(exam) ? exam[0]?.name : exam?.name;
                return <p className="test-context">{examName ?? "Exam preparation"}{stage?.name ? " · " + stage.name : ""}</p>;
              })()}
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
          {!filteredTests.length && <div className="card empty-state"><strong>No tests match your filters.</strong><span>Try another search or clear the filters to see all published tests.</span></div>}
        </div>
      )}
    </div></main>
  );
}
