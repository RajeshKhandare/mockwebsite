"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { testTemplateId: string; languages: string[] };

export default function StartTest({ testTemplateId, languages }: Props) {
  const router = useRouter();
  const [language, setLanguage] = useState(languages[0] ?? "en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true); setError("");
    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ testTemplateId, language }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        const next = window.location.pathname;
        router.push("/login?next=" + encodeURIComponent(next));
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
      <label htmlFor="test-language" style={{display:"block",fontWeight:700,marginBottom:8}}>Test language</label>
      <select id="test-language" value={language} onChange={(e) => setLanguage(e.target.value)}
        style={{width:"100%",height:46,border:"1px solid var(--border)",borderRadius:8,padding:"0 12px",background:"white"}}>
        {languages.map((value) => <option key={value} value={value}>{value === "en" ? "English" : value === "hi" ? "Hindi" : "Marathi"}</option>)}
      </select>
      {error && <p style={{color:"var(--danger)",marginTop:10}}>{error}</p>}
      <button className="btn btn-primary" disabled={loading} onClick={start} style={{marginTop:16}}>
        {loading ? "Preparing test…" : "Start test"}
      </button>
    </div>
  );
}
