import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Performance Analytics | MockTest", robots: { index: false, follow: false } };

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="page-shell narrow-shell"><section className="auth-card"><p className="eyebrow">Analytics</p><h1>Sign in required</h1><p className="muted">Log in to view your performance analytics.</p><Link className="button primary" href="/login?next=/dashboard/analytics">Go to login</Link></section></main>;

  const [{ data: stats }, { data: attempts }] = await Promise.all([
    supabase.from("performance_stats").select("attempts_count,completed_count,average_accuracy,average_score,total_time_seconds").eq("user_id", user.id).maybeSingle(),
    supabase.from("test_attempts").select("id,status,language,started_at,test_template_id").eq("user_id", user.id).eq("status","submitted").order("started_at",{ascending:false}).limit(20),
  ]);
  const ids=(attempts??[]).map(a=>a.id);
  const templateIds=[...new Set((attempts??[]).map(a=>a.test_template_id))];
  const [{data:results},{data:templates}] = await Promise.all([
    ids.length ? supabase.from("results").select("attempt_id,correct_count,incorrect_count,unattempted_count,score,accuracy,time_taken_seconds").in("attempt_id",ids) : Promise.resolve({data:[]}),
    templateIds.length ? supabase.from("test_templates").select("id,title").in("id",templateIds) : Promise.resolve({data:[]}),
  ]);
  const resultMap=new Map((results??[]).map(r=>[r.attempt_id,r]));
  const templateMap=new Map((templates??[]).map(t=>[t.id,t]));
  const completed=attempts??[];
  const totalQuestions=completed.reduce((sum,a)=>{const r=resultMap.get(a.id);return sum+Number(r?.correct_count??0)+Number(r?.incorrect_count??0)+Number(r?.unattempted_count??0)},0);
  const answered=completed.reduce((sum,a)=>{const r=resultMap.get(a.id);return sum+Number(r?.correct_count??0)+Number(r?.incorrect_count??0)},0);

  return <main className="page-shell">
    <div className="section-heading"><div><p className="eyebrow">Student performance</p><h1>Analytics</h1><p className="muted">Turn every mock test into a clear picture of accuracy, speed and consistency.</p></div><Link className="button" href="/dashboard">Dashboard</Link></div>
    <div className="dashboard-nav"><Link href="/dashboard">Overview</Link><Link href="/dashboard/history">Test history</Link><Link className="active" href="/dashboard/analytics">Analytics</Link><Link href="/profile">Profile</Link></div>
    <div className="stat-grid"><div className="stat-card"><span>Total attempts</span><strong>{stats?.attempts_count??0}</strong><small>All recorded attempts</small></div><div className="stat-card"><span>Completed</span><strong>{stats?.completed_count??0}</strong><small>Submitted tests</small></div><div className="stat-card"><span>Average accuracy</span><strong>{Number(stats?.average_accuracy??0).toFixed(1)}%</strong><small>Across completed tests</small></div><div className="stat-card"><span>Average score</span><strong>{Number(stats?.average_score??0).toFixed(1)}</strong><small>Across completed tests</small></div></div>
    <div className="grid"><section className="panel"><p className="eyebrow">Attempt profile</p><h2>Questions answered</h2><p className="muted">{answered} answered questions across {completed.length} completed tests.</p><div className="meta"><span className="badge">{totalQuestions} total questions</span><span className="badge">{totalQuestions?((answered/totalQuestions)*100).toFixed(1):"0.0"}% attempted</span></div></section><section className="panel"><p className="eyebrow">Time</p><h2>Study time in mocks</h2><p className="muted">{Math.floor(Number(stats?.total_time_seconds??0)/60)} minutes recorded across completed attempts.</p></section></div>
    <section className="panel"><div className="section-heading compact"><div><p className="eyebrow">Latest results</p><h2>Recent performance</h2><p className="muted">Open any result to review every answer and explanation.</p></div><Link href="/dashboard/history">Full history</Link></div>{completed.length?<div className="attempt-list">{completed.map(a=>{const r=resultMap.get(a.id);const t=templateMap.get(a.test_template_id);return <Link className="attempt-card" key={a.id} href={"/test/"+a.id+"/result"}><div className="attempt-icon">M</div><div className="attempt-content"><strong>{t?.title??"Mock test"}</strong><p>{a.language.toUpperCase()} · {new Date(a.started_at).toLocaleDateString()} · {Number(r?.score??0).toFixed(2)} score</p></div><div><strong>{Number(r?.accuracy??0).toFixed(1)}%</strong><p className="muted">accuracy</p></div></Link>})}</div>:<div className="empty-state"><strong>Your analytics will appear here.</strong><span>Complete a mock test to start building your performance profile.</span><Link className="button primary" href="/tests">Take a mock test</Link></div>}</section>
  </main>;
}
