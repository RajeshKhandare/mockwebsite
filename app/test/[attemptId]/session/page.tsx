 "use client";
import { useMemo, useState } from "react";

const questions = [
  { id: 1, text: "If a quantity increases from 80 to 100, what is the percentage increase?", options: ["20%", "25%", "30%", "40%"] },
  { id: 2, text: "Choose the word closest in meaning to 'abundant'.", options: ["Rare", "Plentiful", "Weak", "Brief"] },
  { id: 3, text: "A train travels 120 km in 2 hours. What is its average speed?", options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"] },
];

export default function TestSessionPage() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const question = questions[current];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const choose = (index: number) => setAnswers((prev) => ({ ...prev, [question.id]: index }));
  const toggleMark = () => setMarked((prev) => { const next = new Set(prev); next.has(question.id) ? next.delete(question.id) : next.add(question.id); return next; });

  return <main className="section"><div className="container">
    <div className="section-header"><div><div className="eyebrow">Live test</div><h1 style={{fontSize:32}}>Banking Prelims Full Mock</h1><p>Question {current + 1} of {questions.length} · Answered {answered}</p></div><div className="card" style={{padding:"12px 16px"}}><strong>59:42</strong><br/><span style={{color:"var(--muted)",fontSize:12}}>Time remaining</span></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:18}}>
      <section className="card"><h2 style={{fontSize:20}}>Q{question.id}. {question.text}</h2><div style={{display:"grid",gap:10,marginTop:22}}>{question.options.map((option,index)=><button key={option} onClick={()=>choose(index)} className="btn" style={{justifyContent:"flex-start",background:answers[question.id]===index?"#eef3f9":"white",borderColor:answers[question.id]===index?"var(--brand)":"var(--border)"}}>{String.fromCharCode(65+index)}. {option}</button>)}</div>
      <div className="actions"><button className="btn btn-secondary" onClick={()=>setAnswers((prev)=>{const next={...prev}; delete next[question.id]; return next;})}>Clear response</button><button className="btn btn-secondary" onClick={toggleMark}>{marked.has(question.id)?"Unmark":"Mark for review"}</button><button className="btn btn-primary" onClick={()=>setCurrent((v)=>Math.min(questions.length-1,v+1))}>Save & Next</button></div></section>
      <aside className="card"><h3>Question palette</h3><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>{questions.map((q,i)=><button key={q.id} onClick={()=>setCurrent(i)} className="btn" style={{padding:0,minHeight:38,background:answers[q.id]!==undefined?"#dcfce7":marked.has(q.id)?"#fef3c7":"white"}}>{q.id}</button>)}</div><p style={{marginTop:18,fontSize:13,color:"var(--muted)"}}>Green = answered · Amber = marked for review · White = not answered.</p><button className="btn" style={{width:"100%",marginTop:10,borderColor:"var(--danger)",color:"var(--danger)"}}>Submit test</button></aside>
    </div>
  </div></main>;
}
