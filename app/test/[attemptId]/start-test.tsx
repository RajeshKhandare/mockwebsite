"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  testTemplateId: string;
  languages: string[];
  requiresLogin: boolean;
  loggedIn: boolean;
  durationSeconds: number;
  questionCount: number;
};

export default function StartTest({ testTemplateId, languages, requiresLogin, loggedIn, durationSeconds, questionCount }: Props) {
  const router = useRouter();
  const [language, setLanguage] = useState(languages[0] ?? "en");
  const isSpeedTest = durationSeconds === 600;
  const [selectedCount, setSelectedCount] = useState(questionCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true); setError("");
    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ testTemplateId, language, ...(isSpeedTest ? { questionCount: selectedCount } : {}) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        setError("Please sign in above to start this test.");
        setLoading(false);
        return;
      }
      setError(data.error ?? "Could not start the test.");
      setLoading(false);
      return;
    }
    router.push("/test/" + data.attemptId + "/session");
  }

  return (
    <div style={{marginTop:22}}>
      {isSpeedTest && (
        <div style={{marginBottom:18}}>
          <label htmlFor="question-count" style={{display:"block",fontWeight:700,marginBottom:8}}>How many questions do you want to attempt?</label>
          <div className="question-count-options">
            {[5,10,15,20].map((count) => (
              <button key={count} type="button" className={selectedCount === count ? "question-count-option active" : "question-count-option"} onClick={() => setSelectedCount(count)}>
                <strong>{count}</strong><span>questions</span>
              </button>
            ))}
          </div>
          <p className="muted" style={{margin:"8px 0 0",fontSize:12}}>10-minute timer · choose a pace that matches your goal.</p>
        </div>
      )}
      <label htmlFor="test-language" style={{display:"block",fontWeight:700,marginBottom:8}}>Test language</label>
      <select id="test-language" value={language} onChange={(e) => setLanguage(e.target.value)}
        style={{width:"100%",height:46,border:"1px solid var(--border)",borderRadius:8,padding:"0 12px",background:"white"}}>
        {languages.map((value) => <option key={value} value={value}>{value === "en" ? "English" : value === "hi" ? "Hindi" : "Marathi"}</option>)}
      </select>
      {error && <p style={{color:"var(--danger)",marginTop:10}}>{error}</p>}
      <button className="btn btn-primary" disabled={loading || (requiresLogin && !loggedIn)} onClick={start} style={{marginTop:16}}>
        {loading ? "Preparing test…" : requiresLogin && !loggedIn ? "Sign in to start" : "Start test"}
      </button>
    </div>
  );
}
