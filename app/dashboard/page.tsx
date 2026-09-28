import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard | MockTest", robots: { index: false, follow: false } };

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
    supabase.from("profiles").select("display_name,target_exam,preparation_stage,preferred_language").eq("id", user.id).maybeSingle(),
    supabase.from("performance_stats").select("attempts_count,completed_count,average_accuracy,average_score,total_time_seconds").eq("user_id", user.id).maybeSingle(),
    supabase.from("test_attempts").select("id,status,language,started_at,submitted_at,test_template_id,question_count").eq("user_id", user.id).order("started_at", { ascending: false }).limit(6),
  ]);

  const templateIds = [...new Set((attempts ?? []).map((attempt) => attempt.test_template_id))];
  const { data: templates } = templateIds.length
    ? await supabase.from("test_templates").select("id,title,question_count").in("id", templateIds)
    : { data: [] as Array<{id:string;title:string;question_count:number}> };
  const templateMap = new Map((templates ?? []).map((template) => [template.id, template]));

  const name = profile?.display_name || user.email?.split("@")[0] || "Student";
  const completed = Number(stats?.completed_count ?? 0);
  const accuracy = Number(stats?.average_accuracy ?? 0);
  const hours = Math.floor(Number(stats?.total_time_seconds ?? 0) / 3600);

  return (
    <main className="page-shell dashboard-page">
      <section className="account-hero">
        <div className="account-identity">
          <div className="profile-avatar">{name.charAt(0).toUpperCase()}</div>
          <div>
            <p className="eyebrow">Student dashboard</p>
            <h1>Welcome back, {name}</h1>
            <p className="muted">{user.email}</p>
            <div className="profile-tags">
              {profile?.target_exam && <span>{profile.target_exam}</span>}
              {profile?.preparation_stage && <span>{profile.preparation_stage}</span>}
              <span>{profile?.preferred_language?.toUpperCase() ?? "EN"} preferred</span>
            </div>
          </div>
        </div>
        <div className="account-actions">
          <Link className="button" href="/profile">My profile</Link>
          <Link className="button primary" href="/tests">Start a mock test</Link>
        </div>
      </section>

      <div className="dashboard-nav">
        <Link className="active" href="/dashboard">Overview</Link>
        <Link href="/dashboard/history">Test history</Link>
        <Link href="/dashboard/analytics">Analytics</Link>
        <Link href="/profile">Profile</Link>
      </div>

      <section className="stat-grid dashboard-stats">
        <div className="stat-card"><span>Total attempts</span><strong>{stats?.attempts_count ?? 0}</strong><small>All recorded attempts</small></div>
        <div className="stat-card"><span>Completed</span><strong>{completed}</strong><small>Submitted tests</small></div>
        <div className="stat-card"><span>Average accuracy</span><strong>{accuracy.toFixed(1)}%</strong><small>Across completed tests</small></div>
        <div className="stat-card"><span>Study time</span><strong>{hours}h</strong><small>Total recorded test time</small></div>
      </section>

      <div className="dashboard-grid">
        <section className="panel dashboard-main-panel">
          <div className="section-heading compact"><div><p className="eyebrow">Your activity</p><h2>Recent mock tests</h2><p className="muted">See exactly which exam and test each attempt belongs to.</p></div><Link href="/dashboard/history">View all</Link></div>
          {attempts?.length ? (
            <div className="attempt-list">
              {attempts.map((attempt) => {
                const template = templateMap.get(attempt.test_template_id);
                return (
                  <Link className="attempt-card" key={attempt.id} href={attempt.status === "submitted" ? "/test/" + attempt.id + "/result" : "/test/" + attempt.id}>
                    <div className="attempt-icon">M</div>
                    <div className="attempt-content">
                      <div className="attempt-title-row"><strong>{template?.title ?? "Mock test"}</strong><span className={"status-pill " + attempt.status}>{attempt.status.replace("_"," ")}</span></div>
                      <p>{attempt.question_count ?? template?.question_count ?? 0} questions · {attempt.language.toUpperCase()} · {new Date(attempt.started_at).toLocaleDateString()}</p>
                    </div>
                    <span className="attempt-arrow">→</span>
                  </Link>
                );
              })}
            </div>
          ) : <div className="empty-state"><strong>No mock tests yet</strong><span>Start your first test to build your performance profile.</span><Link className="button primary" href="/tests">Explore mock tests</Link></div>}
        </section>

        <aside className="dashboard-side">
          <section className="panel quick-panel">
            <p className="eyebrow">Quick actions</p><h2>Keep preparing</h2>
            <Link href="/tests" className="quick-link"><span>Take a mock test</span><b>→</b></Link>
            <Link href="/practice" className="quick-link"><span>Practice by topic</span><b>→</b></Link>
            <Link href="/dashboard/analytics" className="quick-link"><span>Review analytics</span><b>→</b></Link>
          </section>
          <section className="panel progress-panel">
            <p className="eyebrow">Your focus</p><h2>Build consistency</h2>
            <p className="muted">Use the history and analytics pages after every mock to spot patterns in accuracy, attempts and time.</p>
            <Link className="button" href="/dashboard/analytics">Open analytics</Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
