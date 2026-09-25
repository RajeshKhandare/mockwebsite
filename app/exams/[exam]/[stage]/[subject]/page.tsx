import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ exam: string; stage: string; subject: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam, stage, subject } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("subjects")
    .select("name")
    .eq("slug", subject)
    .maybeSingle();
  return {
    title: row ? `${row.name} Practice | MockTest` : `${stage} Practice | MockTest`,
    description: row ? `${row.name} practice questions and mock tests for ${exam} ${stage}.` : "Subject practice and mock tests.",
  };
}

export default async function SubjectPage({ params }: Props) {
  const { exam, stage, subject } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: stageRow } = await supabase
    .from("exam_stages")
    .select("id,name,exams!inner(name,slug)")
    .eq("slug", stage)
    .eq("exams.slug", exam)
    .maybeSingle();
  if (!stageRow) notFound();

  const { data: subjectRow } = await supabase
    .from("subjects")
    .select("id,name,slug")
    .eq("slug", subject)
    .maybeSingle();
  if (!subjectRow) notFound();

  const { data: link } = await supabase
    .from("exam_stage_subjects")
    .select("subject_id")
    .eq("exam_stage_id", stageRow.id)
    .eq("subject_id", subjectRow.id)
    .maybeSingle();
  if (!link) notFound();

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id,name,slug")
    .eq("subject_id", subjectRow.id)
    .order("name");

  const examData = Array.isArray(stageRow.exams) ? stageRow.exams[0] : stageRow.exams;

  return (
    <main className="section">
      <div className="container">
        <div className="eyebrow">{examData?.name ?? "Exam"} · {stageRow.name}</div>
        <h1 style={{fontSize:42}}>{subjectRow.name}</h1>
        <p style={{maxWidth:720,color:"var(--muted)"}}>Practice this subject with reusable topic and test configuration.</p>
        <div className="section">
          <div className="section-header"><div><h2>Topics</h2><p>Topics are managed in the question catalog.</p></div></div>
          {topicsError ? <div className="card"><p className="muted">Topics could not be loaded right now.</p></div> : (
          <div className="grid">
            {(topics ?? []).map((topic) => (
              <article className="card" key={topic.id}>
                <h3>{topic.name}</h3>
                <p>Topic-level practice can be added without changing the core test engine.</p>
                <Link className="btn btn-secondary" href="/tests">View tests</Link>
              </article>
            ))}
            {!topics?.length && <p className="muted">Topics will appear when this subject is configured.</p>}
          </div>)}
        </div>
        <Link href={`/exams/${exam}/${stage}`}>Back to {stageRow.name}</Link>
      </div>
    </main>
  );
}
