"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { login, signup, requestPasswordReset } from "@/app/login/actions";

type Props = { nextPath: string; error?: string; message?: string; openInitially?: boolean; triggerLabel?: string };

export default function TestAuthBox({ nextPath, error, message, openInitially = true, triggerLabel = "Sign in" }: Props) {
  const [open, setOpen] = useState(openInitially || Boolean(error) || Boolean(message));
  const [mode, setMode] = useState<"login" | "signup" | "reset">(
    error === "reset" || message === "reset-sent" ? "reset" : error === "signup" || message === "check-email" ? "signup" : "login"
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!open) return <button className="auth-trigger" type="button" onClick={() => setOpen(true)}>{triggerLabel}</button>;
  if (!mounted) return null;

  const dialog = (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Student account">
      <button className="auth-backdrop" aria-label="Close account dialog" onClick={() => setOpen(false)} />
      <section className="auth-modal">
        <button className="auth-close" type="button" aria-label="Close" onClick={() => setOpen(false)}>×</button>

        {mode !== "reset" && (
          <div className="auth-mode-switch" role="tablist" aria-label="Account access">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button>
          </div>
        )}

        <p className="eyebrow">{mode === "reset" ? "Account recovery" : mode === "login" ? "Student account" : "Join MockTest"}</p>
        <h2>{mode === "reset" ? "Reset your password." : mode === "login" ? "Welcome back." : "Create your account."}</h2>

        {error === "invalid" && <p className="form-message error">Email or password is incorrect.</p>}
        {error === "signup" && <p className="form-message error">We could not create the account. Please check the details and try again.</p>}
        {error === "exists" && <p className="form-message error">An account already exists for this email. Log in or reset your password.</p>}
        {error === "callback" && <p className="form-message error">The reset link could not be completed. Please request a new reset link in this browser.</p>}
        {message === "check-email" && <p className="form-message success">Check your email to finish creating your account.</p>}
        {message === "reset-sent" && <p className="form-message success">Password reset instructions have been sent to your email.</p>}

        {mode === "login" && (
          <>
            <form className="auth-form auth-modal-form">
              <input type="hidden" name="next" value={nextPath} />
              <input type="hidden" name="inline" value="1" />
              <label>Email<input name="email" type="email" autoComplete="email" required /></label>
              <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
              <button className="button primary auth-submit" formAction={login}>Log in</button>
            </form>
            <button type="button" className="text-button auth-forgot-link" onClick={() => setMode("reset")}>Forgot password?</button>
          </>
        )}

        {mode === "signup" && (
          <form className="auth-form auth-modal-form">
            <input type="hidden" name="next" value={nextPath} />
            <input type="hidden" name="inline" value="1" />
            <label>Name<input name="display_name" type="text" autoComplete="name" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
            <button className="button primary auth-submit" formAction={signup}>Create account</button>
          </form>
        )}

        {mode === "reset" && (
          <form className="auth-form auth-modal-form">
            <input type="hidden" name="next" value={nextPath} />
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <button className="button primary auth-submit" formAction={requestPasswordReset}>Send reset link</button>
          </form>
        )}

        {mode === "reset" && (
          <button type="button" className="auth-mode-link" onClick={() => setMode("login")}>Back to log in</button>
        )}
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
}
