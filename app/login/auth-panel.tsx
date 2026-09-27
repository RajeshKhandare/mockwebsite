"use client";

import { useState } from "react";
import { login, signup, requestPasswordReset } from "./actions";

type ExamOption = { id: string; name: string };
type Props = { next: string; error: string; message: string; exams: ExamOption[] };

export default function AuthPanel({ next, error, message, exams }: Props) {
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
         error === "unconfirmed" ? "Please confirm your email address from the verification email before logging in." :
         error === "signup" ? "We could not create the account. Please check the details and try again." :
         error === "reset" ? "We could not send a reset email. Please try again." :
         error === "exists" ? "An account already exists for this email. Log in or reset your password." :
         error === "callback" ? "The reset link could not be completed. Please request a new reset link in this browser." :
         "Please check the details and try again."}
      </p>}
      {message === "check-email" && <p className="form-message success">Check your email to finish creating your account.</p>}
      {message === "logged-out" && <p className="form-message success">You have been logged out securely. Sign in again whenever you are ready.</p>}
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

          <div className="auth-field-grid">
            <label>Name<input name="display_name" type="text" autoComplete="name" placeholder="Your name" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required /></label>
            <label>Target exam
              <select name="target_exam" defaultValue="">
                <option value="">Select an exam</option>
                {exams.map((exam) => <option key={exam.id} value={exam.name}>{exam.name}</option>)}
              </select>
            </label>
            <label>Education
              <select name="education_level" defaultValue="">
                <option value="">Select education</option>
                <option value="10th">Class 10 / SSC</option>
                <option value="12th">Class 12 / HSC</option>
                <option value="graduate">Graduate</option>
                <option value="postgraduate">Postgraduate</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Preparation stage
              <select name="preparation_stage" defaultValue="">
                <option value="">Select stage</option>
                <option value="beginner">Just starting</option>
                <option value="preparing">Preparing</option>
                <option value="revision">Revision</option>
                <option value="mock-tests">Mock-test focused</option>
              </select>
            </label>
            <label>State
              <select name="state" defaultValue="">
                <option value="">Select state</option>
                <option>Maharashtra</option><option>Gujarat</option><option>Madhya Pradesh</option><option>Rajasthan</option>
                <option>Delhi</option><option>Karnataka</option><option>Uttar Pradesh</option><option>Bihar</option>
                <option>West Bengal</option><option>Tamil Nadu</option><option>Telangana</option><option>Andhra Pradesh</option>
                <option>Other</option>
              </select>
            </label>
            <label>Preferred language
              <select name="preferred_language" defaultValue="en">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
              </select>
            </label>
          </div>

          <p className="auth-profile-hint">These details help us surface relevant exams, mock tests, practice and future study resources. You can update them later from your profile.</p>
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
