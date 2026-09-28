import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Test History | MockTest", robots: { index: false, follow: false } };

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="page-shell narrow-shell"><section className="auth-card"><p className="eyebrow">Test history</p><h1>Sign in required</h1><p className="muted">Sign in to view your completed and in-progress tests.</p><Link className="button primary" href="/login?next=/dashboard/history">Go to login</Link></section></main>;

  const { data: attempts } = await supabase.from("test_attempts").select("id,status,language,started_at,submitted_at,test_template_id,question_count").eq("user_id", user.id).order("started_at", { ascending: false }).limit(50);
  const templateIds=[...new Set((attempts??[]).map(a=>a.test_template_id))];
  const {data:templates}=templateIds.length ? await supabase.from("test_templates").select("id,title,question_count").in("id",templateIds) : {data:[] as Array<{id:string;title:string;question_count:number}>};
  const templateMap=new Map((templates??[]).map(t=>[t.id,t]));
  const resultIds=(attempts??[]).filter(a=>a.status==="submitted").map(a=>a.id);
  const {data:results}=resultIds.length ? await supabase.from("results").select("attempt_id,score,accuracy,correct_count,incorrect_count,unattempted_count").in("attempt_id",resultIds) : {data:[]};
  const resultMap=new Map((results??[]).map(r=>[r.attempt_id,r]));

  return <main className="page-shell">
    <div className="section-heading"><div><p className="eyebrow">Performance</p><h1>Test history</h1><p className="muted">A clear record of every mock test you have attempted.</p></div><div className="button-row"><Link className="button" href="/dashboard">Dashboard</Link><Link className="button primary" href="/tests">New mock test</Link></div></div>
    <div className="dashboard-nav"><Link href="/dashboard">Overview</Link><Link className="active" href="/dashboard/history">Test history</Link><Link href="/dashboard/analytics">Analytics</Link><Link href="/profile">Profile</Link></div>
    <section className="panel">{attempts?.length ? <div className="attempt-list">{attempts.map(attempt=>{const template=templateMap.get(attempt.test_template_id);const result=resultMap.get(attempt.id);return <Link className="attempt-card" key={attempt.id} href={attempt.status==="submitted"?"/test/"+attempt.id+"/result":"/test/"+attempt.id}><div className="attempt-icon">M</div><div className="attempt-content"><div className="attempt-title-row"><strong>{template?.title??"Mock test"}</strong><span className={"status-pill "+attempt.status}>{attempt.status.replace("_"," ")}</span></div><p>{template?.question_count??0} questions · {attempt.language.toUpperCase()} · {new Date(attempt.started_at).toLocaleString()}</p>{result&&<p>{result.correct_count} correct · {result.incorrect_count} incorrect · {result.unattempted_count} skipped · <strong>{Number(result.accuracy).toFixed(1)}% accuracy</strong></p>}</div><span className="attempt-arrow">→</span></Link>})}</div>:<div className="empty-state"><strong>No test history yet</strong><span>Your completed mock tests will appear here with their exam name, score and accuracy.</span><Link className="button primary" href="/tests">Explore mock tests</Link></div>}</section>
  </main>;
}
