"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Question = { id: string; position: number; text: string; options: { id: string; index: number; text: string }[] };
type Payload = {
  attempt: { id: string; status: string; language: string; started_at: string };
  template: { title: string; question_count: number; duration_seconds: number };
  questions: Question[];
  answers?: { question_id: string; selected_option: number | null; marked_for_review: boolean }[];
};

export default function TestSession({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("ambiguous");
  const [reportMessage, setReportMessage] = useState("");
  const [remaining, setRemaining] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    fetch("/api/attempts/" + attemptId).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Unable to load test.");
      setPayload(data);
      const restoredAnswers: Record<string, number | null> = {};
      const restoredMarked = new Set<string>();
      for (const answer of data.answers ?? []) {
        restoredAnswers[answer.question_id] = answer.selected_option;
        if (answer.marked_for_review) restoredMarked.add(answer.question_id);
      }
      setAnswers(restoredAnswers);
      setMarked(restoredMarked);
      setRemaining(Math.max(0, data.template.duration_seconds - Math.floor((Date.now() - Date.parse(data.attempt.started_at)) / 1000)));
    }).catch((e) => setError(e.message));
  }, [attemptId]);

  useEffect(() => {
    if (!payload || payload.attempt.status !== "in_progress") return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, payload.template.duration_seconds - Math.floor((Date.now() - Date.parse(payload.attempt.started_at)) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !submittingRef.current) void submit(true);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [payload, submit]);

  const question = payload?.questions[current];
  const answered = useMemo(() => Object.values(answers).filter((v) => v !== null && v !== undefined).length, [answers]);

  function trackEvent(eventType: "view"|"answer"|"clear"|"mark"|"unmark"|"next"|"previous"|"submit"|"timeout", questionId?: string, selectedOption?: number | null) {
    void fetch("/api/attempts/" + attemptId + "/event", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({eventType, questionId, selectedOption}) }).catch(() => undefined);
  }

  async function reportQuestion() {
    if (!question || reporting) return;
    setReporting(true); setReportMessage("");
    try {
      const response = await fetch("/api/questions/" + question.id + "/report", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({attemptId,reason:reportReason}) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setReportMessage(data.error ?? "Could not report this question."); return; }
      setReportMessage("Thanks. This question has been sent for review.");
    } catch { setReportMessage("Could not send the report."); }
    finally { setReporting(false); }
  }

  async function saveAnswer(questionId: string, selectedOption: number | null, markedForReview: boolean) {
    setSaving(true);
    try {
      const response = await fetch("/api/attempts/" + attemptId + "/answer", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ questionId, selectedOption, markedForReview }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Answer could not be saved.");
        return false;
      }
      trackEvent(selectedOption === null ? "clear" : "answer", questionId, selectedOption);
      return true;
    } catch {
      setError("Network error. Your answer could not be saved.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function choose(index: number) {
    if (!question || submittingRef.current || saving) return;
    const previous = answers[question.id] ?? null;
    setAnswers((prev) => ({ ...prev, [question.id]: index }));
    const ok = await saveAnswer(question.id, index, marked.has(question.id));
    if (!ok) setAnswers((prev) => ({ ...prev, [question.id]: previous }));
  }

  async function clearResponse() {
    if (!question || submittingRef.current || saving) return;
    const ok = await saveAnswer(question.id, null, marked.has(question.id));
    if (ok) setAnswers((prev) => ({...prev, [question.id]: null}));
  }

  async function toggleMark() {
    if (!question || submittingRef.current || saving) return;
    const next = new Set(marked);
    if (next.has(question.id)) next.delete(question.id); else next.add(question.id);
    const ok = await saveAnswer(question.id, answers[question.id] ?? null, next.has(question.id));
    if (ok) setMarked(next);
  }

  const submit = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    if (!auto && !window.confirm("Submit this test? You will not be able to change answers after submission.")) return;
    submittingRef.current = true;
    const response = await fetch("/api/attempts/" + attemptId + "/submit", {method:"POST"});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { submittingRef.current = false; setError(data.error ?? "Could not submit test."); return; }
    router.push("/test/" + attemptId + "/result");
  }, [attemptId, router]);

  function goNext() {
    if (!payload || !question || submittingRef.current || saving) return;
    const currentQuestion = question;
    if (current < payload.questions.length - 1) {
      trackEvent("next", currentQuestion.id, answers[currentQuestion.id] ?? null);
      setCurrent((v) => v + 1);
    }
  }

  if (error) return <main className="section"><div className="container"><div className="card"><h2>Test unavailable</h2><p>{error}</p></div></div></main>;
  if (!payload || !question) return <main className="section"><div className="container"><div className="card"><p>Preparing your test…</p></div></div></main>;

  const minutes = Math.floor(remaining / 60).toString().padStart(2,"0");
  const seconds = (remaining % 60).toString().padStart(2,"0");

  return (
    <main className="section">
      <div className="container">
        <div className="section-header">
          <div><div className="eyebrow">Live test · {payload.attempt.language.toUpperCase()}</div><h1 style={{fontSize:32}}>{payload.template.title}</h1><p>Question {current + 1} of {payload.questions.length} · Answered {answered}</p></div>
          <div className="card" style={{padding:"12px 16px"}}><strong>{minutes}:{seconds}</strong><br/><span style={{color:"var(--muted)",fontSize:12}}>Time remaining</span></div>
        </div>
        <div className="test-layout">
          <section className="card test-question-panel">
            <div className="question-topline"><span className="question-number">Question {current + 1}</span><span className="question-status">{answers[question.id] !== null && answers[question.id] !== undefined ? "Answered" : "Not answered"}</span></div>
            <h2 className="question-title">Q{current + 1}. {question.text}</h2>
            <div className="option-list">
              {question.options.map((option) => (
                <button key={option.id} type="button" onClick={() => void choose(option.index)} className={"option-card " + (answers[question.id] === option.index ? "selected" : "")}>
                  <span className="option-letter">{String.fromCharCode(65 + option.index)}</span>
                  <span className="option-text">{option.text}</span>
                  <span className="option-check" aria-hidden="true">{answers[question.id] === option.index ? "✓" : ""}</span>
                </button>
              ))}
            </div>
            <div className="actions">
              <select aria-label="Report reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)} disabled={reporting}>
                <option value="ambiguous">Ambiguous question</option><option value="wrong_answer">Possible wrong answer</option><option value="typo">Typo</option><option value="outdated">Outdated</option><option value="duplicate">Duplicate</option><option value="translation">Translation issue</option>
              </select>
              <button className="btn btn-secondary" disabled={reporting} onClick={() => void reportQuestion()}>{reporting ? "Reporting…" : "Report question"}</button>
              {reportMessage && <span style={{fontSize:12,color:"var(--muted)"}}>{reportMessage}</span>}
              <button className="btn btn-secondary" disabled={current === 0 || saving} onClick={() => setCurrent((v) => Math.max(0, v - 1))}>Previous</button>
              <button className="btn btn-secondary" disabled={saving} onClick={() => void clearResponse()}>Clear response</button>
              <button className="btn btn-secondary" disabled={saving} onClick={() => void toggleMark()}>{marked.has(question.id) ? "Unmark" : "Mark for review"}</button>
              {current === payload.questions.length - 1 ? (
                <button className="btn btn-primary" disabled={saving} onClick={() => void submit(false)}>Submit test</button>
              ) : (
                <button className="btn btn-primary" disabled={saving} onClick={goNext}>
                  {answers[question.id] === null || answers[question.id] === undefined ? "Skip" : "Save & Next"}
                </button>
              )}
            </div>
          </section>
          <aside className="card question-palette">
            <div className="palette-heading"><div><p className="eyebrow">Navigator</p><h3>Questions</h3></div><strong>{answered}/{payload.questions.length}</strong></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {payload.questions.map((q, i) => <button key={q.id} onClick={() => setCurrent(i)} className="btn" style={{padding:0,minHeight:38,background:answers[q.id]!==undefined && answers[q.id]!==null?"#dcfce7":marked.has(q.id)?"#fef3c7":"white"}}>{i + 1}</button>)}
            </div>
            <div className="palette-legend"><span><i className="legend answered" />Answered</span><span><i className="legend marked" />Review</span><span><i className="legend empty" />Unanswered</span></div>
            <button className="btn" disabled={saving} onClick={() => void submit(false)} style={{width:"100%",marginTop:10,borderColor:"var(--danger)",color:"var(--danger)"}}>Submit test</button>
          </aside>
        </div>
      </div>
    </main>
  );
}
