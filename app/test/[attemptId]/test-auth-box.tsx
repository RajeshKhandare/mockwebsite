import { login, signup } from "@/app/login/actions";

type Props = {
  nextPath: string;
  error?: string;
  message?: string;
};

export default function TestAuthBox({ nextPath, error, message }: Props) {
  return (
    <section className="card" style={{ marginTop: 24, maxWidth: 760 }}>
      <div className="eyebrow">Optional account</div>
      <h2 style={{ marginTop: 6 }}>Sign in to save progress & unlock full analysis</h2>
      <p className="muted">You can take this test without an account. Sign in or create an account for detailed performance analysis, history, recommendations and access to login-required tests.</p>
      {error === "invalid" && <p className="form-message error">Email or password is incorrect. Please try again.</p>}
      {error === "signup" && <p className="form-message error">We could not create the account. Check the required fields and try again.</p>}
      {message === "check-email" && <p className="form-message success">Account created. Check your email if confirmation is enabled.</p>}

      <form className="auth-form" style={{ marginTop: 18 }}>
        <input type="hidden" name="next" value={nextPath} />
        <input type="hidden" name="inline" value="1" />
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
        <button className="button primary" formAction={login}>Log in</button>
      </form>

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>Create account</summary>
        <form className="auth-form" style={{ marginTop: 16 }}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="inline" value="1" />
          <label>Name <span>(optional)</span><input name="display_name" type="text" autoComplete="name" placeholder="Your name" /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <p className="muted" style={{ marginBottom: 0 }}>Optional profile details help us personalize exam recommendations. You can leave all of these blank and change them later.</p>
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
  );
}
