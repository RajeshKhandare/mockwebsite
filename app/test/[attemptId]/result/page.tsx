import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Test Result | MockTest", robots: { index: false, follow: false } };

export default async function ResultPage(props:{params:Promise<{attemptId:string}>}) {
  const {attemptId}=await props.params;
  const guestToken=(await cookies()).get("mock_guest")?.value??null;
  const supabase=createSupabasePublicClient();
  const {data,error}=await supabase.rpc("mock_get_result",{p_attempt_id:attemptId,p_guest_token:guestToken});
  if(error||!data) notFound();

  const attempt=data.attempt;
  const result=data.result;
  const template=data.template;
  if(!attempt||!result||!template) notFound();
  const variant=(template.selection_rules as {variant?:string}|null)?.variant;
  const variantLabel=variant==="level_1"?"Level 1 · Easy":variant==="level_2"?"Level 2 · Medium":variant==="level_3"?"Level 3 · Hard":variant==="full_mock"?"Full Mock":template.test_type.replaceAll("_"," ");
  const links=(data.links??[]) as Array<{question_id:string;position:number}>;
  const questions=(data.questions??[]) as Array<{id:string;question_text:string;explanation:string|null}>;
  const answers=(data.answers??[]) as Array<{question_id:string;selected_option:number|null;marked_for_review:boolean}>;
  const options=(data.options??[]) as Array<{question_id:string;option_index:number;option_text:string;is_correct:boolean}>;
  const questionMap=new Map(questions.map((q)=>[q.id,q]));
  const answerMap=new Map(answers.map((a)=>[a.question_id,a]));
  const optionMap=new Map<string,typeof options>();
  for(const option of options) optionMap.set(option.question_id,[...(optionMap.get(option.question_id)??[]),option]);
  const skippedQuestions=links.filter((link)=>answerMap.get(link.question_id)?.selected_option==null).map((link)=>link.position+1);

  return (
    <main className="page-shell result-page">
      <section className="result-hero">
        <div><p className="eyebrow">Test completed · {variantLabel} · {data.profile?.display_name||"Student"}</p><h1>{template.title}</h1><div className="result-meta"><span>{attempt.language.toUpperCase()}</span><span>{attempt.question_count??links.length} questions</span><span>{new Date(attempt.submitted_at??attempt.started_at).toLocaleDateString()}</span></div></div>
        <div className="result-actions"><Link className="button" href="/dashboard">Dashboard</Link><Link className="button primary" href="/tests">Take another test</Link></div>
      </section>
      <section className="result-overview">
        <div className="score-hero-card"><span>Overall score</span><strong>{Number(result.score).toFixed(2)}</strong><small>{Number(result.accuracy).toFixed(1)}% accuracy</small></div>
        <div className="result-stat"><span>Correct</span><strong>{result.correct_count}</strong><small>questions</small></div>
        <div className="result-stat"><span>Incorrect</span><strong>{result.incorrect_count}</strong><small>questions</small></div>
        <div className="result-stat"><span>Skipped</span><strong>{result.unattempted_count}</strong><small>questions</small></div>
        <div className="result-stat"><span>Time taken</span><strong>{Math.floor(result.time_taken_seconds/60)}m {result.time_taken_seconds%60}s</strong><small>total</small></div>
      </section>
      {skippedQuestions.length>0&&<section className="panel result-status-panel"><div className="panel-title-row"><div><p className="eyebrow">Question status</p><h2>Skipped questions</h2></div><span className="status-pill skipped">{skippedQuestions.length} skipped</span></div><p className="muted">These questions were left unanswered. They did not add or deduct marks.</p><div className="skipped-list">{skippedQuestions.map((position:number)=><span key={position}>Q{position}</span>)}</div></section>}
      {!attempt.user_id&&<section className="panel result-unlock-panel"><p className="eyebrow">Save your progress</p><h2>Your result is ready.</h2><p className="muted">Sign in to keep this attempt in your history and unlock detailed subject, topic and performance analysis.</p><div className="button-row"><Link className="button primary" href={"/login?next=/test/"+attemptId+"/analysis"}>Sign in to continue</Link></div></section>}
      <section className="panel">
        <div className="panel-title-row"><div><p className="eyebrow">Review your attempt</p><h2>Answer review</h2></div>{attempt.user_id&&<Link className="button" href={"/test/"+attemptId+"/analysis"}>View analysis</Link>}</div>
        <div className="answer-review-list">
          {links.map((link)=>{
            const question=questionMap.get(link.question_id); const answer=answerMap.get(link.question_id); const questionOptions=optionMap.get(link.question_id)??[]; const correctOption=questionOptions.find((o)=>o.is_correct); const selectedOption=questionOptions.find((o)=>o.option_index===answer?.selected_option); const isCorrect=Boolean(correctOption&&selectedOption&&correctOption.option_index===selectedOption.option_index); const state=selectedOption?(isCorrect?"Correct":"Incorrect"):"Skipped";
            return question?<article className="answer-review-item" key={question.id}><div className="answer-review-main"><div className="question-review-heading"><span className="question-review-number">Q{link.position+1}</span><strong>{question.question_text}</strong><span className={"status-pill "+state.toLowerCase()}>{state}</span></div><div className="answer-lines"><p><span>Your response</span><strong>{selectedOption?.option_text??"Not answered"}</strong></p><p><span>Correct answer</span><strong>{correctOption?.option_text??"Unavailable"}</strong></p></div>{answer?.marked_for_review&&<span className="review-note">Marked for review during the test</span>}</div><div className="explanation-box"><span>Explanation</span><p>{question.explanation??"No explanation provided."}</p></div></article>:null;
          })}
        </div>
      </section>
      <section className="panel scoring-panel"><div><p className="eyebrow">Scoring</p><h2>How this score was calculated</h2><p className="muted">{attempt.question_count??links.length} questions · +{template.marks_per_question} for correct · −{template.negative_marks} for incorrect.</p></div><div className="button-row"><Link className="button primary" href="/tests">Browse mock tests</Link></div></section>
    </main>
  );
}
