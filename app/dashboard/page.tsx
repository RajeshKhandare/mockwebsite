import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard | MockTest",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page-shell narrow-shell">
        <section className="auth-card">
          <p className="eyebrow">Student area</p><h1>Sign in required</h1>
          <p className="muted">Log in to access your dashboard and test history.</p>
          <Link className="button primary" href="/login?next=/dashboard">Go to login</Link>
        </section>
      </main>
    );
  }

  const [{ data: profile }, { data: stats }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("performance_stats").select("attempts_count,completed_count,average_accuracy,average_score,total_time_seconds").eq("user_id", user.id).maybeSingle(),
    supabase.from("test_attempts").select("id,status,started_at,test_template_id").eq("user_id", user.id).order("started_at", { ascending: false }).limit(5),
  ]);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div><p className="eyebrow">Student dashboard</p><h1>Welcome{profile?.display_name ? " " + profile.display_name : ""}</h1><p className="muted">{user.email}</p></div>
        <form action={logout}><button className="button secondary">Log out</button></form>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><strong>{stats?.attempts_count ?? 0}</strong><span>Total attempts</span></div>
        <div className="stat-card"><strong>{stats?.completed_count ?? 0}</strong><span>Completed</span></div>
        <div className="stat-card"><strong>{Number(stats?.average_accuracy ?? 0).toFixed(1)}%</strong><span>Average accuracy</span></div>
        <div className="stat-card"><strong>{Number(stats?.average_score ?? 0).toFixed(1)}</strong><span>Average score</span></div>
      </div>
      <section className="panel">
        <div className="section-heading compact"><div><h2>Recent attempts</h2><p className="muted">Your latest mock-test activity.</p></div><Link href="/dashboard/history">View history</Link></div>
        {attempts?.length ? (
          <div className="list-stack">
            {attempts.map((attempt) => (
              <Link className="list-row" key={attempt.id} href={attempt.status === "submitted" ? "/test/" + attempt.id + "/result" : "/test/" + attempt.id}>
                <span>{attempt.status.replace("_", " ")}</span><small>{new Date(attempt.started_at).toLocaleString()}</small>
              </Link>
            ))}
          </div>
        ) : <p className="empty-state">No attempts yet. Choose a mock test to get started.</p>}
      </section>
    </main>
  );
}
