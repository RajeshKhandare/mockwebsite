import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin | MockTest",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) redirect("/login?next=/admin");

  const db = createSupabaseAdminClient();
  const [{ count: total }, { count: pending }, { count: approved }, { count: rejected }] = await Promise.all([
    db.from("questions").select("id", { count: "exact", head: true }),
    db.from("questions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("questions").select("id", { count: "exact", head: true }).eq("status", "approved"),
    db.from("questions").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div><p className="eyebrow">Administration</p><h1>Question operations</h1><p className="muted">Review, validate and publish the reusable question pool.</p></div>
        <Link href="/admin/questions">Review questions</Link>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><strong>{total ?? 0}</strong><span>Total questions</span></div>
        <div className="stat-card"><strong>{pending ?? 0}</strong><span>Pending review</span></div>
        <div className="stat-card"><strong>{approved ?? 0}</strong><span>Approved</span></div>
        <div className="stat-card"><strong>{rejected ?? 0}</strong><span>Rejected</span></div>
      </div>
      <section className="panel">
        <h2>Review workflow</h2>
        <p className="muted">AI-generated or imported questions should remain outside the live pool until validation and human review are complete.</p>
        <Link className="button primary" href="/admin/questions">Open question review queue</Link>
      </section>
    </main>
  );
}
