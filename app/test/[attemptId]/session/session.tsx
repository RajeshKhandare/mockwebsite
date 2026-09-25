"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = { id: string; position: number; text: string; options: { id: string; index: number; text: string }[] };
type Payload = {
  attempt: { id: string; status: string; language: string; started_at: string };
  template: { title: string; question_count: number; duration_seconds: number };
  questions: Question[];
};

export default function TestSession({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    fetch("/api/attempts/" + attemptId).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Unable to load test.");
      setPayload(data);
      setRemaining(Math.max(0, data.template.duration_seconds - Math.floor((Date.now() - Date.parse(data.attempt.started_at)) / 1000)));
    }).catch((e) => setError(e.message));
  }, [attemptId]);

  useEffect(() => {
    if (!payload || payload.attempt.status !== "in_progress") return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, payload.template.duration_seconds - Math.floor((Date.now() - Date.parse(payload.attempt.started_at)) / 1000));
      setRemaining(seconds);
      if (seconds === 0) void submit(true);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [payload]);

  const question = payload?.questions[current];
  const answered = useMemo(() => Object.values(answers).filter((v) => v !== null && v !== undefined).length, [answers]);

  async function saveAnswer(questionId: string, selectedOption: number | null, markedForReview: boolean) {
    setSaving(true);
    const response = await fetch("/api/attempts/" + attemptId + "/answer", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ questionId, selectedOption, markedForReview }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Answer could not be saved.");
    }
    setSaving(false);
  }

  function choose(index: number) {
    if (!question) return;
    setAnswers((prev) => ({...prev, [question.id]: index}));
    void saveAnswer(question.id, index, marked.has(question.id));
  }

  function clearResponse() {
    if (!question) return;
    setAnswers((prev) => ({...prev, [question.id]: null}));
    void saveAnswer(question.id, null, marked.has(question.id));
  }

  function toggleMark() {
    if (!question) return;
    const next = new Set(marked);
    if (next.has(question.id)) next.delete(question.id); else next.add(question.id);
    setMarked(next);
    void saveAnswer(question.id, answers[question.id] ?? null, next.has(question.id));
  }

  async function submit(auto = false) {
    if (!auto && !window.confirm("Submit this test? You will not be able to change answers after submission.")) return;
    const response = await fetch("/api/attempts/" + attemptId + "/submit", {method:"POST"});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error ?? "Could not submit test."); return; }
    router.push("/test/" + attemptId + "/result");
  }

  if (error) return <main className="section"><div className="container"><div className="card"><h2>Test unavailable</h2><p>{error}</p></div></div></main>;
  if (!payload || !question) return <main className="section"><div className="container"><div className="card"><p>Preparing your test…</p></div></div></main>;

  const minutes = Math.floor(remaining / 60).toString().padStart(2,"0");
  const seconds = (remaining % 60).toString().padStart(2,"0");

  return <main className="section"><div className="container">
    <div className="section-header">
      <div><div className="eyebrow">Live test · {payload.attempt.language.toUpperCase()}</div><h1 style={{fontSize:32}}>{payload.template.title}</h1><p>Question {current + 1} of {payload.questions.length} · Answered {answered}</p></div>
      <div className="card" style={{padding:"12px 16px"}}><strong>{minutes}:{seconds}</strong><br/><span style={{color:"var(--muted)",fontSize:12}}>Time remaining</span></div>
    </div>
    <div className="test-layout">
      <section className="card">
        <h2 style={{fontSize:20}}>Q{current + 1}. {question.text}</h2>
        <div style={{display:"grid",gap:10,marginTop:22}}>
          {question.options.map((option) => (
            <button key={option.id} onClick={() => choose(option.index)} className="btn"
              style={{justifyContent:"flex-start",background:answers[question.id]===option.index?"#eef3f9":"white",borderColor:answers[question.id]===option.index?"var(--brand)":"var(--border)"}}>
              {String.fromCharCode(65 + option.index)}. {option.text}
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={clearResponse}>Clear response</button>
          <button className="btn btn-secondary" onClick={toggleMark}>{marked.has(question.id) ? "Unmark" : "Mark for review"}</button>
          <button className="btn btn-primary" disabled={saving} onClick={() => setCurrent((v) => Math.min(payload.questions.length - 1, v + 1))}>Save & Next</button>
        </div>
      </section>
      <aside className="card">
        <h3>Question palette</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {payload.questions.map((q, i) => <button key={q.id} onClick={() => setCurrent(i)} className="btn" style={{padding:0,minHeight:38,background:answers[q.id]!==undefined && answers[q.id]!==null?"#dcfce7":marked.has(q.id)?"#fef3c7":"white"}}>{i + 1}</button>)}
        </div>
        <p style={{marginTop:18,fontSize:13,color:"var(--muted)"}}>Green = answered · Amber = marked for review · White = not answered.</p>
        <button className="btn" disabled={saving} onClick={() => void submit(false)} style={{width:"100%",marginTop:10,borderColor:"var(--danger)",color:"var(--danger)"}}>Submit test</button>
      </aside>
    </div>
  </div>;
}
