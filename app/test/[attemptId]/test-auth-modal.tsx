"use client";

import { useState } from "react";
import { login, signup } from "@/app/login/actions";

export default function TestAuthModal({ next, onClose }: { next: string; onClose: () => void }) {
  const [mode, setMode] = useState<"login"|"signup">("login");

  return (
    <div className="test-auth-overlay" role="dialog" aria-modal="true" aria-label="Sign in required">
      <div className="test-auth-card">
        <button type="button" className="test-auth-close" onClick={onClose} aria-label="Close">×</button>
        <span className="eyebrow">Account required</span>
        <h2>Sign in to start this mock test</h2>
        <p>100-question mock tests require an account so your attempt, answers and result can be saved securely.</p>

        <div className="test-auth-tabs">
          <button type="button" className={mode==="login"?"active":""} onClick={() => setMode("login")}>Sign in</button>
          <button type="button" className={mode==="signup"?"active":""} onClick={() => setMode("signup")}>Create account</button>
        </div>

        {mode==="login" ? (
          <form className="test-auth-form">
            <input type="hidden" name="next" value={next} />
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="button primary" formAction={login}>Sign in & start test</button>
          </form>
        ) : (
          <form className="test-auth-form">
            <input type="hidden" name="next" value={next} />
            <label>Name<input name="display_name" type="text" autoComplete="name" placeholder="Your name" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required /></label>
            <button className="button primary" formAction={signup}>Create account & continue</button>
          </form>
        )}
      </div>
    </div>
  );
}
