import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Test History | MockTest",
  robots: { index: false, follow: false },
};

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <main className="page-shell narrow-shell"><section className="auth-card"><h1>Sign in required</h1><Link className="button primary" href="/login?next=/dashboard/history">Go to login</Link></section></main>;

  const { data: attempts } = await supabase.from("test_attempts")
    .select("id,status,language,started_at,test_template_id")
    .eq("user_id", user.id).order("started_at", { ascending: false }).limit(50);

  return (
    <main className="page-shell">
      <div className="section-heading"><div><p className="eyebrow">Performance</p><h1>Test history</h1><p className="muted">Every attempt stays tied to your account.</p></div><Link href="/dashboard">Dashboard</Link></div>
      <section className="panel">
        {attempts?.length ? attempts.map((attempt) => (
          <Link className="list-row" key={attempt.id} href={attempt.status === "submitted" ? "/test/" + attempt.id + "/result" : "/test/" + attempt.id}>
            <span>{attempt.status} · {attempt.language.toUpperCase()}</span><small>{new Date(attempt.started_at).toLocaleString()}</small>
          </Link>
        )) : <p className="empty-state">No test attempts yet.</p>}
      </section>
    </main>
  );
}
