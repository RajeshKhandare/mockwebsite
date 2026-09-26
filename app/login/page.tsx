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
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <button className="button primary" formAction={login}>Log in</button>
        </form>

        <details style={{ marginTop: 22 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>Create account</summary>
          <form className="auth-form" style={{ marginTop: 16 }}>
            <input type="hidden" name="next" value={next} />
            <label>Name <span>(optional)</span><input name="display_name" type="text" autoComplete="name" placeholder="Your name" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
            <label>Target exam <span>(optional)</span><input name="target_exam" type="text" placeholder="e.g. Banking, SSC, UPSC" /></label>
            <label>Education level <span>(optional)</span>
              <select name="education_level" defaultValue="">
                <option value="">Prefer not to say</option><option>School</option><option>College</option><option>Graduate</option><option>Postgraduate</option><option>Working professional</option>
              </select>
            </label>
            <label>State <span>(optional)</span><input name="state" type="text" placeholder="e.g. Maharashtra" /></label>
            <label>Preparation stage <span>(optional)</span>
              <select name="preparation_stage" defaultValue="">
                <option value="">Select later</option><option>Just starting</option><option>Preparing regularly</option><option>Revision</option><option>Final preparation</option>
              </select>
            </label>
            <label>Preferred test language <span>(optional)</span>
              <select name="preferred_language" defaultValue="">
                <option value="">Select later</option><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option>
              </select>
            </label>
            <button className="button secondary" formAction={signup}>Create account</button>
          </form>
        </details>
      </section>
    </main>
  );
}
