import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAttemptOwner } from "@/lib/attempt-owner";
import TestAuthBox from "../test-auth-box";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Test Analysis | MockTest", robots: { index: false, follow: false } };

type Metric = { total:number; correct:number; incorrect:number; unattempted:number };

export default async function AnalysisPage(props: { params: Promise<{ attemptId: string }>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { attemptId } = await props.params;
  const searchParams = await props.searchParams;
  const error = typeof searchParams?.error === "string" ? searchParams.error : "";
  const message = typeof searchParams?.message === "string" ? searchParams.message : "";
  const owner = await getAttemptOwner();
  if (!owner.userId && !owner.guestToken) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: attempt } = await supabase.from("test_attempts")
    .select("id,status,test_template_id,language,user_id,guest_token").eq("id",attemptId).maybeSingle();
  if (!attempt || (owner.userId ? attempt.user_id !== owner.userId : attempt.guest_token !== owner.guestToken)) notFound();

  if (!owner.userId) {
    return <main className="page-shell"><div className="section-heading"><div>
      <p className="eyebrow">Full analysis locked</p><h1>Sign in to unlock detailed performance analysis</h1>
      <p className="muted">Your basic result is available without an account. Sign in to see subject and topic breakdowns, history and personalized recommendations.</p>
    </div></div><TestAuthBox nextPath={"/test/"+attemptId+"/analysis"} error={error} message={message}/></main>;
  }
  if (attempt.status !== "submitted") redirect("/test/"+attemptId);

  const [{data:result},{data:template},{data:links},{data:answers}] = await Promise.all([
    supabase.from("results").select("correct_count,incorrect_count,unattempted_count,score,accuracy,time_taken_seconds,section_metrics,topic_metrics").eq("attempt_id",attemptId).single(),
    supabase.from("test_templates").select("title").eq("id",attempt.test_template_id).single(),
    supabase.from("test_attempt_questions").select("question_id,position").eq("attempt_id",attemptId).order("position"),
    supabase.from("test_answers").select("question_id,selected_option").eq("attempt_id",attemptId),
  ]);
  if (!result || !template) notFound();

  const ids=(links??[]).map(row=>row.question_id);
  const {data:questions}=ids.length
    ? await supabase.from("questions").select("id,subject_id,topic_id").in("id",ids)
    : {data:[] as Array<{id:string;subject_id:string|null;topic_id:string|null}>};
  const subjectIds=[...new Set((questions??[]).map(q=>q.subject_id).filter((x):x is string=>Boolean(x)))];
  const topicIds=[...new Set((questions??[]).map(q=>q.topic_id).filter((x):x is string=>Boolean(x)))];
  const [{data:subjects},{data:topics}] = await Promise.all([
    subjectIds.length ? supabase.from("subjects").select("id,name").in("id",subjectIds) : Promise.resolve({data:[] as Array<{id:string;name:string}>}),
    topicIds.length ? supabase.from("topics").select("id,name").in("id",topicIds) : Promise.resolve({data:[] as Array<{id:string;name:string}>}),
  ]);

  const subjectMap=new Map((subjects??[]).map(s=>[s.id,s.name]));
  const topicMap=new Map((topics??[]).map(t=>[t.id,t.name]));
  const answerMap=new Map((answers??[]).map(a=>[a.question_id,a.selected_option]));
  const {data:options}=ids.length ? await supabase.from("question_options").select("question_id,option_index,is_correct").in("question_id",ids) : {data:[] as Array<{question_id:string;option_index:number;is_correct:boolean}>};
  const correctMap=new Map<string,number>();
  for(const option of options??[]) if(option.is_correct) correctMap.set(option.question_id,option.option_index);

  const subjectMetrics=new Map<string,Metric>();
  const topicMetrics=new Map<string,Metric>();
  for(const q of questions??[]){
    const selected=answerMap.get(q.id), correct=correctMap.get(q.id);
    const add=(map:Map<string,Metric>,key:string|null)=>{
      if(!key)return; const s=map.get(key)??{total:0,correct:0,incorrect:0,unattempted:0}; s.total++;
      if(selected===undefined||selected===null)s.unattempted++; else if(selected===correct)s.correct++; else s.incorrect++;
      map.set(key,s);
    };
    add(subjectMetrics,q.subject_id); add(topicMetrics,q.topic_id);
  }

  const weakTopics=[...topicMetrics.entries()].map(([id,s])=>({id,name:topicMap.get(id)??"Topic",accuracy:s.correct+s.incorrect?(s.correct/(s.correct+s.incorrect))*100:0}))
    .sort((a,b)=>a.accuracy-b.accuracy).slice(0,3);

  return <main className="page-shell">
    <div className="section-heading"><div><p className="eyebrow">Performance analysis</p><h1>{template.title}</h1><p className="muted">Subject and topic diagnosis · {attempt.language.toUpperCase()}</p></div>
      <div className="button-row"><Link className="button" href={"/test/"+attemptId+"/result"}>Result</Link><Link className="button primary" href="/dashboard">Dashboard</Link></div></div>
    <div className="result-grid">
      <div className="result-card primary-result"><span>Score</span><strong>{Number(result.score).toFixed(2)}</strong></div>
      <div className="result-card"><span>Accuracy</span><strong>{Number(result.accuracy).toFixed(1)}%</strong></div>
      <div className="result-card"><span>Attempted</span><strong>{result.correct_count+result.incorrect_count}</strong></div>
      <div className="result-card"><span>Unattempted</span><strong>{result.unattempted_count}</strong></div>
      <div className="result-card"><span>Time</span><strong>{Math.floor(result.time_taken_seconds/60)}m {result.time_taken_seconds%60}s</strong></div>
    </div>
    {weakTopics.length>0 && <section className="panel"><p className="eyebrow">Recommended next step</p><h2>Strengthen your weakest topics</h2>
      <div className="list-stack">{weakTopics.map(t=><article className="list-row" key={t.id}><div><strong>{t.name}</strong><p className="muted">Current accuracy: {t.accuracy.toFixed(1)}% · targeted practice recommended.</p></div><Link className="button" href={"/practice?topic="+encodeURIComponent(t.id)}>Practice</Link></article>)}</div>
    </section>}
    <section className="panel"><h2>Subject analysis</h2><div className="list-stack">
      {[...subjectMetrics.entries()].map(([id,s])=>{const accuracy=s.correct+s.incorrect?(s.correct/(s.correct+s.incorrect))*100:0;return <article className="list-row" key={id}><div><strong>{subjectMap.get(id)??"Other"}</strong><p className="muted">{s.total} questions · {s.correct} correct · {s.incorrect} incorrect · {s.unattempted} unattempted</p></div><strong>{accuracy.toFixed(1)}%</strong></article>})}
      {!subjectMetrics.size&&<p className="muted">Subject analysis is not available for this attempt.</p>}
    </div></section>
    <section className="panel"><h2>Topic analysis</h2><div className="list-stack">
      {[...topicMetrics.entries()].sort((a,b)=>{const aa=a[1].correct+a[1].incorrect?a[1].correct/(a[1].correct+a[1].incorrect):0;const bb=b[1].correct+b[1].incorrect?b[1].correct/(b[1].correct+b[1].incorrect):0;return aa-bb;}).map(([id,s])=>{const accuracy=s.correct+s.incorrect?(s.correct/(s.correct+s.incorrect))*100:0;return <article className="list-row" key={id}><div><strong>{topicMap.get(id)??"Topic"}</strong><p className="muted">{s.total} questions · {s.correct} correct · {s.incorrect} incorrect · {s.unattempted} unattempted</p></div><strong>{accuracy.toFixed(1)}%</strong></article>})}
      {!topicMetrics.size&&<p className="muted">Topic analysis is not available for this attempt.</p>}
    </div></section>
  </main>;
}
