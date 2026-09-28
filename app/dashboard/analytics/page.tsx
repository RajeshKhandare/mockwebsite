import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import PerformanceMatrix from "./performance-matrix";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Performance Analytics | MockTest", robots: { index: false, follow: false } };

type Metric = { total?: number; correct?: number; incorrect?: number; unattempted?: number };

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="page-shell narrow-shell"><section className="auth-card"><p className="eyebrow">Analytics</p><h1>Sign in required</h1><p className="muted">Log in to view your performance analytics.</p><Link className="button primary" href="/login?next=/dashboard/analytics">Go to login</Link></section></main>;

  const [{ data: profile }, { data: stats }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("performance_stats").select("attempts_count,completed_count,average_accuracy,average_score,total_time_seconds").eq("user_id", user.id).maybeSingle(),
    supabase.from("test_attempts").select("id,status,language,started_at,submitted_at,test_template_id,question_count").eq("user_id", user.id).eq("status","submitted").order("started_at",{ascending:false}).limit(50),
  ]);

  const completed = attempts ?? [];
  const ids = completed.map((attempt) => attempt.id);
  const templateIds = [...new Set(completed.map((attempt) => attempt.test_template_id))];
  const [{ data: results }, { data: templates }] = await Promise.all([
    ids.length ? supabase.from("results").select("attempt_id,correct_count,incorrect_count,unattempted_count,score,accuracy,time_taken_seconds,subject_metrics").in("attempt_id", ids) : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    templateIds.length ? supabase.from("test_templates").select("id,title").in("id", templateIds) : Promise.resolve({ data: [] as Array<{id:string;title:string}> }),
  ]);

  const resultMap = new Map((results ?? []).map((result) => [String(result.attempt_id), result]));
  const templateMap = new Map((templates ?? []).map((template) => [template.id, template]));
  const latestAttempt = completed[0];
  const latestResult = latestAttempt ? resultMap.get(latestAttempt.id) : null;

  const numeric = (value: unknown) => Number(value ?? 0);
  const latestScore = numeric(latestResult?.score);
  const latestAccuracy = numeric(latestResult?.accuracy);
  const latestTime = numeric(latestResult?.time_taken_seconds);
  const personalScores = (results ?? []).map((result) => numeric(result.score)).filter(Number.isFinite);
  const personalAverageScore = personalScores.length ? personalScores.reduce((a,b) => a+b,0) / personalScores.length : numeric(stats?.average_score);
  const personalBest = personalScores.length ? Math.max(...personalScores) : latestScore;

  // Aggregate anonymous benchmark data server-side; only the resulting averages/percentile are rendered.
  let benchmarkScores: number[] = [];
  if (latestAttempt) {
    const admin = createSupabaseAdminClient();
    const { data: benchmarkAttempts } = await admin
      .from("test_attempts")
      .select("id")
      .eq("test_template_id", latestAttempt.test_template_id)
      .eq("status", "submitted")
      .limit(500);
    const benchmarkIds = (benchmarkAttempts ?? []).map((row) => row.id);
    if (benchmarkIds.length) {
      const { data: benchmarkResults } = await admin.from("results").select("attempt_id,score,accuracy").in("attempt_id", benchmarkIds);
      benchmarkScores = (benchmarkResults ?? []).map((row) => numeric(row.score)).filter(Number.isFinite);
    }
  }
  const averageScore = benchmarkScores.length ? benchmarkScores.reduce((a,b) => a+b,0) / benchmarkScores.length : personalAverageScore;
  const bestScore = benchmarkScores.length ? Math.max(...benchmarkScores) : personalBest;
  const percentile = benchmarkScores.length > 1 && latestResult
    ? (benchmarkScores.filter((score) => score <= latestScore).length / benchmarkScores.length) * 100
    : null;

  const subjects = new Map<string, {name:string;total:number;correct:number;incorrect:number;unattempted:number}>();
  const subjectMetrics = (latestResult?.subject_metrics ?? {}) as Record<string, Metric>;
  const subjectIds = Object.keys(subjectMetrics);
  if (subjectIds.length) {
    const { data: subjectRows } = await supabase.from("subjects").select("id,name").in("id", subjectIds);
    const names = new Map((subjectRows ?? []).map((subject) => [subject.id, subject.name]));
    for (const [id, metric] of Object.entries(subjectMetrics)) {
      subjects.set(id, {
        name: names.get(id) ?? "Subject",
        total: numeric(metric.total),
        correct: numeric(metric.correct),
        incorrect: numeric(metric.incorrect),
        unattempted: numeric(metric.unattempted),
      });
    }
  }

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Student";
  const totalAttempts = numeric(stats?.attempts_count) || completed.length;
  const completedCount = numeric(stats?.completed_count) || completed.length;
  const averageAccuracy = numeric(stats?.average_accuracy) || (results?.length ? results.reduce((sum,result) => sum + numeric(result.accuracy),0) / results.length : 0);
  const totalTime = numeric(stats?.total_time_seconds) || completed.reduce((sum,attempt) => sum + numeric(resultMap.get(attempt.id)?.time_taken_seconds),0);

  return (
    <main className="page-shell analytics-page">
      <div className="section-heading analytics-heading">
        <div>
          <p className="eyebrow">Student performance</p>
          <h1>{displayName} · Analytics</h1>
          <p className="muted">{user.email}</p>
          <p className="analytics-subtitle">A visual view of your score, accuracy, speed and subject-level strengths.</p>
        </div>
        <div className="button-row"><Link className="button" href="/dashboard">Dashboard</Link><Link className="button primary" href="/tests">Take a mock test</Link></div>
      </div>

      <div className="dashboard-nav analytics-page-nav">
        <Link href="/dashboard">Overview</Link><Link href="/dashboard/history">Test history</Link><Link className="active" href="/dashboard/analytics">Analytics</Link><Link href="/profile">Profile</Link>
      </div>

      <section className="analytics-stat-strip">
        <div><span>Total attempts</span><strong>{totalAttempts}</strong><small>All recorded attempts</small></div>
        <div><span>Completed</span><strong>{completedCount}</strong><small>Submitted tests</small></div>
        <div><span>Average accuracy</span><strong>{averageAccuracy.toFixed(1)}%</strong><small>Across completed tests</small></div>
        <div><span>Study time</span><strong>{Math.floor(totalTime / 60)}m</strong><small>Recorded mock time</small></div>
      </section>

      {latestResult ? (
        <PerformanceMatrix
          score={latestScore}
          accuracy={latestAccuracy}
          averageScore={averageScore}
          averageAccuracy={benchmarkScores.length ? (benchmarkScores.reduce((sum, score) => sum + score, 0) / benchmarkScores.length) : averageAccuracy}
          bestScore={bestScore}
          timeSeconds={latestTime}
          percentile={percentile}
          subjects={[...subjects.values()]}
        />
      ) : (
        <section className="report-card analytics-empty-report">
          <div className="analytics-empty-icon">◎</div>
          <p className="eyebrow">Your performance report</p>
          <h2>Complete your first mock to unlock this view.</h2>
          <p className="muted">After submission, MockTest will build your score summary, subject comparison, accuracy trend and personalised practice signals here.</p>
          <Link className="button primary" href="/tests">Choose a mock test</Link>
        </section>
      )}

      <section className="panel analytics-recent">
        <div className="section-heading compact"><div><p className="eyebrow">Recent attempts</p><h2>Keep an eye on your trend</h2></div><Link href="/dashboard/history">Full history</Link></div>
        {completed.length ? <div className="attempt-list">{completed.slice(0,5).map((attempt) => {
          const result = resultMap.get(attempt.id);
          const template = templateMap.get(attempt.test_template_id);
          return <Link className="attempt-card" key={attempt.id} href={"/test/"+attempt.id+"/result"}>
            <div className="attempt-icon">M</div>
            <div className="attempt-content"><strong>{template?.title ?? "Mock test"}</strong><p>{attempt.question_count ?? 0} questions · {new Date(attempt.started_at).toLocaleDateString()}</p></div>
            <div><strong>{numeric(result?.accuracy).toFixed(1)}%</strong><p className="muted">accuracy</p></div>
          </Link>;
        })}</div> : null}
      </section>
    </main>
  );
}
