import { login, signup } from "@/app/login/actions";

type Props = {
  nextPath: string;
  error?: string;
  message?: string;
  openInitially?: boolean;
  triggerLabel?: string;
};

export default function TestAuthBox({
  nextPath,
  error,
  message,
  openInitially = true,
  triggerLabel = "Sign in for full analysis",
}: Props) {
  const initiallyOpen = openInitially || Boolean(error) || Boolean(message);

  return (
    <details className="auth-dialog" open={initiallyOpen}>
      <summary className="auth-trigger">{initiallyOpen ? "Close" : triggerLabel}</summary>
      <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Sign in">
        <div className="auth-backdrop" />
        <section className="auth-modal">
        <div className="auth-modal-header">
          <div className="auth-modal-mark">M</div>
          <div>
            <p className="eyebrow">Student account</p>
            <h2>Unlock your full preparation view</h2>
          </div>
        </div>
        <p className="muted">Continue on this page. Sign in to save your performance, unlock detailed analysis and get recommendations matched to your preparation.</p>

        {error === "invalid" && <p className="form-message error">Email or password is incorrect. Please try again.</p>}
        {error === "signup" && <p className="form-message error">We could not create the account. Please check the details and try again.</p>}
        {message === "check-email" && <p className="form-message success">Account created. Check your email if confirmation is enabled.</p>}

        <form className="auth-form auth-modal-form">
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="inline" value="1" />
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <button className="button primary auth-submit" formAction={login}>Log in</button>
        </form>

        <div className="auth-divider"><span>New here?</span></div>

        <details className="signup-details">
          <summary>Create account</summary>
          <form className="auth-form" style={{ marginTop: 14 }}>
            <input type="hidden" name="next" value={nextPath} />
            <input type="hidden" name="inline" value="1" />
            <label>Name <span>(optional)</span><input name="display_name" type="text" autoComplete="name" placeholder="Your name" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
            <div className="profile-intro">Optional details help personalize your exam, article and practice recommendations. You can skip every field.</div>
            <label>Target exam <span>(optional)</span><input name="target_exam" type="text" placeholder="Banking, SSC, UPSC…" /></label>
            <div className="auth-two-col">
              <label>Education <span>(optional)</span><select name="education_level" defaultValue=""><option value="">Select</option><option>School</option><option>College</option><option>Graduate</option><option>Postgraduate</option><option>Working professional</option></select></label>
              <label>State <span>(optional)</span><input name="state" type="text" placeholder="Maharashtra" /></label>
            </div>
            <div className="auth-two-col">
              <label>Preparation stage <span>(optional)</span><select name="preparation_stage" defaultValue=""><option value="">Select</option><option>Just starting</option><option>Preparing regularly</option><option>Revision</option><option>Final preparation</option></select></label>
              <label>Preferred language <span>(optional)</span><select name="preferred_language" defaultValue=""><option value="">Select</option><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option></select></label>
            </div>
            <button className="button secondary" formAction={signup}>Create account</button>
          </form>
        </details>
        </section>
      </div>
    </details>
  );
}
