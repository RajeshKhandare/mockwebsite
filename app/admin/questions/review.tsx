"use client";

import { useState } from "react";

type Question = {
  id:string; language:string; question_text:string; explanation:string|null; difficulty:string;
  status:string; source_type:string; created_at:string; quality_score:number|null; quality_confidence:number|null;
  validation_status:string; review_required:boolean;
};
type Option = { question_id:string; option_index:number; option_text:string; is_correct:boolean };

export default function QuestionReview({ question, options }: { question: Question; options: Option[] }) {
  const [status, setStatus] = useState(question.status);
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [error, setError] = useState("");

  async function validate() {
    setLoading(true); setError(""); setValidationMessage("");
    try {
      const response = await fetch("/api/admin/questions/" + question.id + "/validate", { method:"POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error ?? "Validation failed."); return; }
      const result = data.validation;
      setStatus(result?.passed ? "approved" : "needs_review");
      setValidationMessage(result?.passed
        ? "Automatic checks passed. The question is now in the approved pool."
        : "Automatic checks found an issue. Review is required before publication.");
    } catch { setError("Validation request failed."); }
    finally { setLoading(false); }
  }

  async function update(nextStatus: "approved" | "rejected" | "needs_review") {
    setLoading(true); setError(""); setValidationMessage("");
    try {
      const response = await fetch("/api/admin/questions/" + question.id, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status:nextStatus}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error ?? "Could not update question."); return; }
      setStatus(nextStatus);
    } catch { setError("Question update failed."); }
    finally { setLoading(false); }
  }

  return (
    <article className="panel">
      <div className="section-heading compact">
        <div>
          <span className="badge">{status}</span>{" "}
          <span className="badge">{question.language.toUpperCase()}</span>{" "}
          <span className="badge">{question.difficulty}</span>{" "}
          {question.quality_score !== null && <span className="badge">QC {Number(question.quality_score).toFixed(0)}</span>}
        </div>
        <small className="muted">{question.source_type} · {question.validation_status}</small>
      </div>
      <h2 style={{fontSize:20}}>{question.question_text}</h2>
      <ol style={{lineHeight:1.8}}>
        {options.map((option) => <li key={option.option_index} style={{fontWeight:option.is_correct?700:400}}>
          {option.option_text}{option.is_correct ? " · answer key" : ""}
        </li>)}
      </ol>
      {question.explanation && <p className="muted"><strong>Explanation:</strong> {question.explanation}</p>}
      <div className="actions">
        <button className="button primary" disabled={loading} onClick={() => void validate()}>Run automatic validation</button>
        <button className="button primary" disabled={loading} onClick={() => void update("approved")}>Approve</button>
        <button className="button secondary" disabled={loading} onClick={() => void update("needs_review")}>Keep for review</button>
        <button className="button secondary" disabled={loading} onClick={() => void update("rejected")}>Reject</button>
      </div>
      {validationMessage && <p className="form-message">{validationMessage}</p>}
      {error && <p className="form-message error">{error}</p>}
    </article>
  );
}
