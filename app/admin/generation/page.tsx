import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import QuestionFactory from "./form";

export const metadata: Metadata = { title: "Question Factory | MockTest", robots: { index: false, follow: false } };

export default async function QuestionGenerationPage() {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) redirect("/login?next=/admin/generation");

  const db = createSupabaseAdminClient();
  const [{ data: stages }, { data: subjects }, { data: topics }] = await Promise.all([
    db.from("exam_stages").select("id,name,exam_id").order("name"),
    db.from("subjects").select("id,name").eq("is_active", true).order("name"),
    db.from("topics").select("id,name,subject_id").eq("is_active", true).order("name"),
  ]);
  const { data: exams } = await db.from("exams").select("id,name").eq("is_active", true).order("name");

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin · question factory</p>
          <h1>Generate and validate question batches</h1>
          <p className="muted">Paste a provider-generated JSON batch or an internally authored batch. The server validates every item, detects duplicates and automatically publishes structurally verified questions.</p>
        </div>
      </div>
      <QuestionFactory exams={exams ?? []} stages={stages ?? []} subjects={subjects ?? []} topics={topics ?? []} />
    </main>
  );
}
