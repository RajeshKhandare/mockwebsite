"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Checking reset session…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setStatus("Account service is temporarily unavailable.");
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setReady(Boolean(data.session));
      setStatus(data.session ? "" : "This reset link is no longer active. Request a new reset link.");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setStatus("");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function update() {
    const supabase = createClient();
    if (!supabase) return setStatus("Account service is temporarily unavailable.");
    if (!ready) return setStatus("This reset link is no longer active. Request a new reset link.");
    if (password.length < 8) return setStatus("Use at least 8 characters.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setStatus(error.message);
    setStatus("Password updated successfully. You can now log in.");
    setPassword("");
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="auth-card auth-card-premium">
        <p className="eyebrow">Account security</p>
        <h1>Set a new password.</h1>
        <p className="muted">Choose a new password for your MockTest account.</p>
        {!ready && <p className="form-message error">{status}</p>}
        {ready && status && <p className="form-message success">{status}</p>}
        <div className="auth-form">
          <label>New password<input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready} /></label>
          <button className="button primary" type="button" onClick={update} disabled={!ready}>Update password</button>
        </div>
        <Link className="auth-mode-link" href="/login">Back to log in</Link>
      </section>
    </main>
  );
}
