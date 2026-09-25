import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Performance Analytics | MockTest",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page-shell narrow-shell">
        <section className="auth-card">
          <h1>Sign in required</h1>
          <p className="muted">Log in to view your performance analytics.</p>
          <Link className="button primary" href="/login?next=/dashboard/analytics">Go to login</Link>
        </section>
      </main>
    );
  }

  const [{ data: stats }, { data: attempts }] = await Promise.all([
    supabase.from("performance_stats")
      .select("attempts_count,completed_count,average_accuracy,average_score,total_time_seconds")
      .eq("user_id", user.id).maybeSingle(),
    supabase.from("test_attempts")
      .select("id,status,language,started_at,test_template_id")
      .eq("user_id", user.id).eq("status", "submitted")
      .order("started_at", { ascending: false }).limit(20),
  ]);

  const ids = (attempts ?? []).map((attempt) => attempt.id);
  const { data: results } = ids.length
    ? await supabase.from("results")
        .select("attempt_id,correct_count,incorrect_count,unattempted_count,score,accuracy,time_taken_seconds")
        .in("attempt_id", ids)
    : { data: [] };

  const resultMap = new Map((results ?? []).map((result) => [result.attempt_id, result]));
  const completed = attempts ?? [];
  const totalQuestions = completed.reduce((sum, attempt) => {
    const result = resultMap.get(attempt.id);
    return sum + Number(result?.correct_count ?? 0) + Number(result?.incorrect_count ?? 0) + Number(result?.unattempted_count ?? 0);
  }, 0);
  const answered = completed.reduce((sum, attempt) => {
    const result = resultMap.get(attempt.id);
    return sum + Number(result?.correct_count ?? 0) + Number(result?.incorrect_count ?? 0);
  }, 0);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div><p className="eyebrow">Student performance</p><h1>Analytics</h1><p className="muted">Track accuracy, scores, attempt volume and time across completed tests.</p></div>
        <Link href="/dashboard">Dashboard</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><strong>{stats?.attempts_count ?? 0}</strong><span>Total attempts</span></div>
        <div className="stat-card"><strong>{stats?.completed_count ?? 0}</strong><span>Completed</span></div>
        <div className="stat-card"><strong>{Number(stats?.average_accuracy ?? 0).toFixed(1)}%</strong><span>Average accuracy</span></div>
        <div className="stat-card"><strong>{Number(stats?.average_score ?? 0).toFixed(1)}</strong><span>Average score</span></div>
      </div>

      <div className="grid">
        <section className="panel">
          <h2>Answer profile</h2>
          <p className="muted">{answered} answered questions across the latest {completed.length} completed attempts.</p>
          <div className="meta">
            <span className="badge">{totalQuestions} total questions</span>
            <span className="badge">{totalQuestions ? ((answered / totalQuestions) * 100).toFixed(1) : "0.0"}% attempted</span>
          </div>
        </section>
        <section className="panel">
          <h2>Time spent</h2>
          <p className="muted">{Math.floor(Number(stats?.total_time_seconds ?? 0) / 60)} minutes recorded across completed attempts.</p>
        </section>
      </div>

      <section className="panel">
        <div className="section-heading compact"><div><h2>Recent performance</h2><p className="muted">Latest completed test results.</p></div><Link href="/dashboard/history">Full history</Link></div>
        {completed.length ? (
          <div className="list-stack">
            {completed.map((attempt) => {
              const result = resultMap.get(attempt.id);
              return (
                <Link className="list-row" key={attempt.id} href={"/test/" + attempt.id + "/result"}>
                  <span>{attempt.language.toUpperCase()} · {Number(result?.score ?? 0).toFixed(2)} score</span>
                  <small>{Number(result?.accuracy ?? 0).toFixed(1)}% accuracy · {new Date(attempt.started_at).toLocaleDateString()}</small>
                </Link>
              );
            })}
          </div>
        ) : <p className="empty-state">Complete a mock test to start building your performance history.</p>}
      </section>
    </main>
  );
}
