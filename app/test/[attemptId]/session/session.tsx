"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Question = { id: string; position: number; text: string; options: { id: string; index: number; text: string }[] };
type Payload = {
  attempt: { id: string; status: string; language: string; started_at: string; duration_seconds: number | null };
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const submittingRef = useRef(false);
  const startingRef = useRef(false);

  const submit = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
     const response = await fetch("/api/attempts/" + attemptId + "/submit", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      submittingRef.current = false;
      setError(data.error ?? "Could not submit test.");
      setSubmitOpen(false);
      return;
    }
    router.push("/test/" + attemptId + "/result");
  }, [attemptId, router]);

  useEffect(() => {
    fetch("/api/attempts/" + attemptId)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load test.");
        setPayload(data);
        const restoredAnswers: Record<string, number | null> = {};
        const restoredMarked = new Set<string>();
        for (const answer of data.answers ?? []) {
          restoredAnswers[answer.question_id] = answer.selected_option;
          if (answer.marked_for_review) restoredMarked.add(answer.question_id);
        }
        setAnswers(restoredAnswers);
        setMarked(restoredMarked);

        if (data.attempt.duration_seconds != null) {
          setStarted(true);
          setRemaining(Math.max(0, Number(data.attempt.duration_seconds) - Math.floor((Date.now() - Date.parse(data.attempt.started_at)) / 1000)));
        } else {
          setCountdown(5);
        }
      })
      .catch((e) => setError(e.message));
  }, [attemptId]);

  const startClock = useCallback(async () => {
    if (startingRef.current || started) return;
    startingRef.current = true;
    try {
      const response = await fetch("/api/attempts/" + attemptId + "/start", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not start the test clock.");
      setPayload((previous) => previous ? {
        ...previous,
        attempt: { ...previous.attempt, started_at: data.startedAt, duration_seconds: data.durationSeconds },
      } : previous);
      setRemaining(Number(data.durationSeconds));
      setStarted(true);
      setCountdown(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the test clock.");
    } finally {
      startingRef.current = false;
    }
  }, [attemptId, started]);

  useEffect(() => {
    if (countdown === null || started) return;
    if (countdown === 0) {
      const timer = window.setTimeout(() => void startClock(), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setCountdown((value) => value === null ? null : value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, started, startClock]);

  useEffect(() => {
    if (!payload || !started || payload.attempt.status !== "in_progress") return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Number(payload.attempt.duration_seconds ?? payload.template.duration_seconds) - Math.floor((Date.now() - Date.parse(payload.attempt.started_at)) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !submittingRef.current) void submit(true);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [payload, started, submit]);

  const question = payload?.questions[current];
  const answered = useMemo(() => Object.values(answers).filter((value) => value !== null && value !== undefined).length, [answers]);
  const skipped = payload ? payload.questions.length - answered : 0;
  const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  function trackEvent(eventType: "view"|"answer"|"clear"|"mark"|"unmark"|"next"|"previous"|"submit"|"timeout", questionId?: string, selectedOption?: number | null) {
    void fetch("/api/attempts/" + attemptId + "/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, questionId, selectedOption }),
    }).catch(() => undefined);
  }

  async function reportQuestion() {
    if (!question || reporting) return;
    setReporting(true);
    setReportMessage("");
    try {
      const response = await fetch("/api/questions/" + question.id + "/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, reason: reportReason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setReportMessage(data.error ?? "Could not report this question."); return; }
      setReportMessage("Thanks. This question has been sent for review.");
    } catch {
      setReportMessage("Could not send the report.");
    } finally {
      setReporting(false);
    }
  }

  async function saveAnswer(questionId: string, selectedOption: number | null, markedForReview: boolean) {
    setSaving(true);
    try {
      const response = await fetch("/api/attempts/" + attemptId + "/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    if (!question || !started || submittingRef.current || saving) return;
    const previous = answers[question.id] ?? null;
    setAnswers((prev) => ({ ...prev, [question.id]: index }));
    const ok = await saveAnswer(question.id, index, marked.has(question.id));
    if (!ok) setAnswers((prev) => ({ ...prev, [question.id]: previous }));
  }

  async function clearResponse() {
    if (!question || !started || submittingRef.current || saving) return;
    const ok = await saveAnswer(question.id, null, marked.has(question.id));
    if (ok) setAnswers((prev) => ({ ...prev, [question.id]: null }));
  }

  async function toggleMark() {
    if (!question || !started || submittingRef.current || saving) return;
    const next = new Set(marked);
    if (next.has(question.id)) next.delete(question.id); else next.add(question.id);
    const ok = await saveAnswer(question.id, answers[question.id] ?? null, next.has(question.id));
    if (ok) setMarked(next);
  }

  function goNext() {
    if (!payload || !question || !started || submittingRef.current || saving) return;
    trackEvent("next", question.id, answers[question.id] ?? null);
    setCurrent((value) => Math.min(payload.questions.length - 1, value + 1));
  }

  function goPrevious() {
    if (!question || current === 0 || saving) return;
    trackEvent("previous", question.id, answers[question.id] ?? null);
    setCurrent((value) => Math.max(0, value - 1));
  }

  if (error) {
    return <main className="section"><div className="container"><div className="card test-error-card"><div className="test-error-icon">!</div><h2>Test unavailable</h2><p>{error}</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button></div></div></main>;
  }

  if (!payload || !question) {
    return (
      <main className="test-loading-screen">
        <div className="test-loading-orbit"><span /><span /><span /></div>
        <strong>Loading your test</strong>
        <p>Preparing questions, timer and secure answer saving…</p>
      </main>
    );
  }

  return (
    <main className="live-test-page">
      <div className={"live-test-shell" + (countdown !== null ? " countdown-blurred" : "")}>
        <header className="live-test-header">
          <div className="live-test-brand">
            <span className="live-test-mark">M</span>
            <div><strong>{payload.template.title}</strong><span>{payload.attempt.language.toUpperCase()} · {payload.questions.length} questions</span></div>
          </div>
          <div className="live-test-progress">
            <span>{answered} answered</span><span>{skipped} skipped</span>
          </div>
          <div className={"live-timer " + (remaining <= 60 && started ? "urgent" : "")}>
            <span className="live-timer-label">TIME LEFT</span>
            <strong>{started ? minutes + ":" + seconds : "--:--"}</strong>
          </div>
        </header>

        <div className="container live-test-content">
          <div className="live-test-main">
            <div className="live-test-question-head">
              <div><span className="live-kicker">Question {current + 1} of {payload.questions.length}</span><h1>{question.text}</h1></div>
              <span className={"question-state " + (answers[question.id] != null ? "answered" : "skipped")}>{answers[question.id] != null ? "Answered" : "Skipped"}</span>
            </div>

            <div className="live-options">
              {question.options.map((option) => (
                <button key={option.id} type="button" disabled={!started || saving} onClick={() => void choose(option.index)} className={"live-option " + (answers[question.id] === option.index ? "selected" : "")}>
                  <span className="live-option-letter">{String.fromCharCode(65 + option.index)}</span>
                  <span>{option.text}</span>
                  <span className="live-option-check" aria-hidden="true">{answers[question.id] === option.index ? "✓" : ""}</span>
                </button>
              ))}
            </div>

            <div className="live-question-tools">
              <div className="live-report">
                <select aria-label="Report reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)} disabled={reporting}>
                  <option value="ambiguous">Ambiguous</option><option value="wrong_answer">Wrong answer</option><option value="typo">Typo</option><option value="outdated">Outdated</option><option value="duplicate">Duplicate</option><option value="translation">Translation</option>
                </select>
                <button className="text-button" disabled={reporting} onClick={() => void reportQuestion()}>{reporting ? "Sending…" : "Report question"}</button>
                {reportMessage && <span>{reportMessage}</span>}
              </div>
              <div className="live-actions">
                <button className="btn btn-secondary" disabled={current === 0 || saving} onClick={goPrevious}>Previous</button>
                <button className="btn btn-secondary" disabled={saving || !started} onClick={() => void clearResponse()}>Clear</button>
                <button className={"btn " + (marked.has(question.id) ? "btn-review-active" : "btn-secondary")} disabled={saving || !started} onClick={() => void toggleMark()}>
                  {marked.has(question.id) ? "Marked for review" : "Mark for review"}
                </button>
                {current === payload.questions.length - 1 ? (
                  <button className="btn btn-primary" disabled={saving || !started} onClick={() => setSubmitOpen(true)}>Submit test</button>
                ) : (
                  <button className="btn btn-primary" disabled={saving || !started} onClick={goNext}>
                    {answers[question.id] == null ? "Skip & next" : "Save & next"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="live-palette">
            <div className="live-palette-top"><div><span className="live-kicker">Navigator</span><h2>Questions</h2></div><strong>{answered}/{payload.questions.length}</strong></div>
            <div className="live-palette-grid">
              {payload.questions.map((item, index) => {
                const isAnswered = answers[item.id] !== null && answers[item.id] !== undefined;
                const isMarked = marked.has(item.id);
                const isCurrent = current === index;
                return (
                  <button key={item.id} type="button" onClick={() => setCurrent(index)} className={"palette-question " + (isCurrent ? "current " : "") + (isAnswered ? "answered " : "") + (isMarked ? "marked" : "")}>
                    <span>{index + 1}</span>
                    <small>{isAnswered ? "Done" : isMarked ? "Review" : "Skip"}</small>
                  </button>
                );
              })}
            </div>
            <div className="palette-summary">
              <span><i className="palette-dot done" />Answered <b>{answered}</b></span>
              <span><i className="palette-dot review" />Review <b>{marked.size}</b></span>
              <span><i className="palette-dot skip" />Skipped <b>{skipped}</b></span>
            </div>
            <button className="btn btn-primary live-submit-wide" disabled={saving || !started} onClick={() => setSubmitOpen(true)}>Review & submit</button>
          </aside>
        </div>
      </div>

      {countdown !== null && (
        <div className="test-countdown-overlay" role="status" aria-live="assertive">
          <div className="test-countdown-card">
            <div className="countdown-orbit"><div className="countdown-number">{countdown === 0 ? "GO" : countdown}</div></div>
            <span className="eyebrow">Get ready</span>
            <h2>Your test begins shortly</h2>
            <p>Your questions are ready. The official timer starts after the countdown.</p>
          </div>
        </div>
      )}

      {submitOpen && (
        <div className="test-submit-overlay" role="dialog" aria-modal="true" aria-label="Review test submission">
          <div className="test-submit-card">
            <span className="eyebrow">Final check</span>
            <h2>Ready to submit?</h2>
            <p>Review your attempt before ending the test. Unanswered questions will be counted as skipped.</p>
            <div className="submit-summary"><div><strong>{answered}</strong><span>Answered</span></div><div><strong>{marked.size}</strong><span>Marked</span></div><div><strong>{skipped}</strong><span>Skipped</span></div></div>
            <div className="button-row">
              <button className="btn btn-secondary" onClick={() => setSubmitOpen(false)}>Continue test</button>
              <button className="btn btn-primary" onClick={() => void submit(false)}>Submit test</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
