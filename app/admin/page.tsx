import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin | MockTest", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) redirect("/login?next=/admin");

  const db = createSupabaseAdminClient();
  const [{ count: total }, { count: pending }, { count: approved }, { count: rejected }, { count: batches }, { count: reports }] = await Promise.all([
    db.from("questions").select("id",{count:"exact",head:true}),
    db.from("questions").select("id",{count:"exact",head:true}).in("status",["pending","needs_review"]),
    db.from("questions").select("id",{count:"exact",head:true}).eq("status","approved"),
    db.from("questions").select("id",{count:"exact",head:true}).eq("status","rejected"),
    db.from("question_batches").select("id",{count:"exact",head:true}),
    db.from("question_reports").select("id",{count:"exact",head:true}).eq("status","open"),
  ]);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div><p className="eyebrow">Administration</p><h1>Question operations</h1><p className="muted">Automated validation, exception review, quality monitoring and production-pool management.</p></div>
        <div className="button-row"><Link className="button" href="/admin/questions">Review queue</Link><Link className="button primary" href="/admin/generation">Question factory</Link></div>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><strong>{total ?? 0}</strong><span>Total questions</span></div>
        <div className="stat-card"><strong>{pending ?? 0}</strong><span>Needs attention</span></div>
        <div className="stat-card"><strong>{approved ?? 0}</strong><span>Approved pool</span></div>
        <div className="stat-card"><strong>{rejected ?? 0}</strong><span>Rejected</span></div>
        <div className="stat-card"><strong>{batches ?? 0}</strong><span>Question batches</span></div>
        <div className="stat-card"><strong>{reports ?? 0}</strong><span>Open reports</span></div>
      </div>
      <section className="panel">
        <h2>Automated quality workflow</h2>
        <p className="muted">Batch candidates are schema-checked, option-checked, answer-key checked and scanned for near-duplicates. Passing candidates can enter the reusable approved pool automatically; exceptions remain in the review queue.</p>
        <div className="button-row"><Link className="button primary" href="/admin/generation">Open question factory</Link><Link className="button" href="/admin/questions">Open review queue</Link></div>
      </section>
    </main>
  );
}
