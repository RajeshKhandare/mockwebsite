import type { Metadata } from "next";
import { login, signup } from "./actions";

export const metadata: Metadata = {
  title: "Login | MockTest",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const message = typeof params.message === "string" ? params.message : "";
  const next = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/dashboard";

  return (
    <main className="page-shell narrow-shell">
      <section className="auth-card">
        <p className="eyebrow">Student account</p>
        <h1>Sign in to continue</h1>
        <p className="muted">Access mock tests, attempts, results and performance history.</p>
        {error && <p className="form-message error">Please check your details and try again.</p>}
        {message === "check-email" && <p className="form-message success">Account created. Check your email if confirmation is enabled.</p>}
        <form className="auth-form">
          <input type="hidden" name="next" value={next} />
          <label>Name <span>(for new accounts)</span><input name="display_name" type="text" autoComplete="name" placeholder="Your name" /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <div className="auth-actions">
            <button className="button primary" formAction={login}>Log in</button>
            <button className="button secondary" formAction={signup}>Create account</button>
          </div>
        </form>
      </section>
    </main>
  );
}
