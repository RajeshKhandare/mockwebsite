"use client";

import { useState } from "react";
import { login, signup, requestPasswordReset } from "./actions";

type Props = { next: string; error: string; message: string };

export default function AuthPanel({ next, error, message }: Props) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">(
    error === "reset" || message === "reset-sent" ? "reset" : error === "signup" || message === "check-email" ? "signup" : "login"
  );

  return (
    <section className="auth-card auth-card-premium">
      {mode !== "reset" && (
        <div className="auth-mode-switch" role="tablist" aria-label="Account access">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button>
        </div>
      )}

      <p className="eyebrow">{mode === "reset" ? "Account recovery" : mode === "login" ? "Student account" : "Join MockTest"}</p>
      <h1>{mode === "reset" ? "Reset your password." : mode === "login" ? "Welcome back." : "Create your account."}</h1>
      <p className="muted">
        {mode === "reset" ? "Enter your account email and we’ll send you a secure password reset link." : mode === "login" ? "Continue your preparation from where you left off." : "Keep your attempts, results and preparation history together."}
      </p>

      {error && <p className="form-message error">
        {error === "invalid" ? "Email or password is incorrect." :
         error === "signup" ? "We could not create the account. Please check the details and try again." :
         error === "reset" ? "We could not send a reset email. Please try again." :
         error === "exists" ? "An account already exists for this email. Log in or reset your password." :
         error === "callback" ? "The reset link could not be completed. Please request a new reset link in this browser." :
         "Please check the details and try again."}
      </p>}
      {message === "check-email" && <p className="form-message success">Check your email to finish creating your account.</p>}
      {message === "reset-sent" && <p className="form-message success">Password reset instructions have been sent to your email.</p>}

      {mode === "login" && (
        <>
          <form className="auth-form">
            <input type="hidden" name="next" value={next} />
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="button primary" formAction={login}>Log in</button>
          </form>
          <button type="button" className="text-button auth-forgot-link" onClick={() => setMode("reset")}>Forgot password?</button>
        </>
      )}

      {mode === "signup" && (
        <form className="auth-form">
          <input type="hidden" name="next" value={next} />
          <label>Name<input name="display_name" type="text" autoComplete="name" /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <button className="button primary" formAction={signup}>Create account</button>
        </form>
      )}

      {mode === "reset" && (
        <form className="auth-form">
          <input type="hidden" name="next" value={next} />
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <button className="button primary" formAction={requestPasswordReset}>Send reset link</button>
        </form>
      )}

      {mode === "reset" && (
        <button type="button" className="auth-mode-link" onClick={() => setMode("login")}>Back to log in</button>
      )}
    </section>
  );
}
