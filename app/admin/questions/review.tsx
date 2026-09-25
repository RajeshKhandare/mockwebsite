"use client";

import { useState } from "react";

type Question = { id:string; language:string; question_text:string; explanation:string|null; difficulty:string; status:string; source_type:string; created_at:string };
type Option = { question_id:string; option_index:number; option_text:string; is_correct:boolean };

export default function QuestionReview({ question, options }: { question: Question; options: Option[] }) {
  const [status, setStatus] = useState(question.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function update(nextStatus: "approved" | "rejected" | "pending") {
    setLoading(true); setError("");
    const response = await fetch("/api/admin/questions/" + question.id, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({status:nextStatus}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error ?? "Could not update question.");
    else setStatus(nextStatus);
    setLoading(false);
  }

  return (
    <article className="panel">
      <div className="section-heading compact">
        <div><span className="badge">{status}</span> <span className="badge">{question.language.toUpperCase()}</span> <span className="badge">{question.difficulty}</span></div>
        <small className="muted">{question.source_type}</small>
      </div>
      <h2 style={{fontSize:20}}>{question.question_text}</h2>
      <ol style={{lineHeight:1.8}}>
        {options.map((option) => <li key={option.option_index} style={{fontWeight:option.is_correct?700:400}}>{option.option_text}{option.is_correct ? " · answer key" : ""}</li>)}
      </ol>
      {question.explanation && <p className="muted"><strong>Explanation:</strong> {question.explanation}</p>}
      <div className="actions">
        <button className="button primary" disabled={loading} onClick={() => void update("approved")}>Approve</button>
        <button className="button secondary" disabled={loading} onClick={() => void update("pending")}>Keep pending</button>
        <button className="button secondary" disabled={loading} onClick={() => void update("rejected")}>Reject</button>
      </div>
      {error && <p className="form-message error">{error}</p>}
    </article>
  );
}
