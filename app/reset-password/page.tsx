"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  async function update() {
    if (password.length < 8) return setStatus("Use at least 8 characters.");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return setStatus("Account service is temporarily unavailable.");
    const supabase = createClient(url, key);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setStatus(error.message);
    setStatus("Password updated. You can now log in.");
  }
  return (
    <main className="page-shell narrow-shell">
      <section className="auth-card auth-card-premium">
        <p className="eyebrow">Account security</p>
        <h1>Set a new password.</h1>
        <p className="muted">Choose a new password for your MockTest account.</p>
        <div className="auth-form">
          <label>New password<input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="button primary" type="button" onClick={update}>Update password</button>
        </div>
        {status && <p className="form-message success">{status}</p>}
      </section>
    </main>
  );
}
