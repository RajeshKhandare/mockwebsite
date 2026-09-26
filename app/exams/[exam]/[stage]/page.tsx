import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ exam: string; stage: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam, stage } = await params;
  const supabase = createSupabasePublicClient();
  const { data: row } = await supabase
    .from("exam_stages")
    .select("name,exams!inner(name,slug)")
    .eq("slug", stage)
    .eq("exams.slug", exam)
    .maybeSingle();

  if (!row) return { title: "Exam Stage | MockTest" };
  const examRelation = (row as unknown as { exams?: { name?: string; slug?: string } | Array<{ name?: string; slug?: string }> }).exams;
  const examName = Array.isArray(examRelation) ? examRelation[0]?.name : examRelation?.name;
  return {
    title: `${row.name} Mock Tests | ${examName ?? "MockTest"}`,
    description: `Practice ${row.name} questions, subjects and mock tests.`,
  };
}

export default async function ExamStagePage({ params }: Props) {
  const { exam, stage } = await params;
  const supabase = createSupabasePublicClient();

  const { data: stageRow, error: stageError } = await supabase
    .from("exam_stages")
    .select("id,name,description,exams!inner(name,slug)")
    .eq("slug", stage)
    .eq("exams.slug", exam)
    .maybeSingle();

  if (stageError) return <main className="section"><div className="container"><div className="card"><h2>Stage unavailable</h2><p className="muted">This stage could not be loaded right now.</p></div></div></main>;
  if (!stageRow) notFound();

  const [{ data: subjectLinks, error: subjectsError }, { data: tests, error: testsError }] = await Promise.all([
    supabase
      .from("exam_stage_subjects")
      .select("subject_id,sort_order,subjects(id,name,slug)")
      .eq("exam_stage_id", stageRow.id)
      .order("sort_order"),
    supabase
      .from("test_templates")
      .select("id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,supported_languages")
      .eq("exam_stage_id", stageRow.id)
      .eq("is_active", true)
      .order("title"),
  ]);

  const examRelation = (stageRow as unknown as { exams?: { name?: string; slug?: string } | Array<{ name?: string; slug?: string }> }).exams;
  const examData = Array.isArray(examRelation) ? examRelation[0] : examRelation;

  return (
    <main className="section">
      <div className="container">
        <div className="eyebrow">{examData?.name ?? "Exam"} · Stage</div>
        <h1 style={{fontSize:42}}>{stageRow.name}</h1>
        <p style={{maxWidth:720,color:"var(--muted)"}}>{stageRow.description ?? "Prepare with structured subjects and mock tests."}</p>

        {(subjectsError || testsError) ? <div className="card"><p className="muted">Stage content could not be loaded completely right now. Please try again shortly.</p></div> : <>
        <section className="section">
          <div className="section-header"><div><h2>Subjects</h2><p>Subject structure comes from the exam configuration.</p></div></div>
          <div className="grid">
            {(subjectLinks ?? []).map((link) => {
              const subject = Array.isArray(link.subjects) ? link.subjects[0] : link.subjects;
              return subject ? (
                <article className="card" key={subject.id}>
                  <h3>{subject.name}</h3>
                  <p>Practice questions and topic-level preparation for this subject.</p>
                  <Link className="btn btn-secondary" href={`/exams/${exam}/${stage}/${subject.slug}`}>View subject</Link>
                </article>
              ) : null;
            })}
            {!subjectLinks?.length && <p className="muted">Subjects will appear when this stage is configured.</p>}
          </div>
        </section>

        <section className="section">
          <div className="section-header"><div><h2>Mock tests</h2><p>Published tests for this stage.</p></div><Link href="/tests">All tests</Link></div>
          <div className="grid">
            {(tests ?? []).map((test) => (
              <article className="card" key={test.id}>
                <div className="eyebrow">{test.test_type.replace("_"," ")}</div>
                <h3>{test.title}</h3>
                <p>{test.description}</p>
                <div className="meta">
                  <span className="badge">{test.question_count} questions</span>
                  <span className="badge">{Math.round(test.duration_seconds / 60)} min</span>
                </div>
                <Link className="btn btn-primary" href={`/test/${test.slug ?? test.id}`}>View instructions</Link>
              </article>
            ))}
            {!tests?.length && <p className="muted">No published mock tests are available for this stage yet.</p>}
          </div>
        </section>
        </>}
      </div>
    </main>
  );
}
