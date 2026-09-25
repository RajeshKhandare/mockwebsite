export const metadata = {
  title: "Resources | MockTest",
  description: "Structured resources for competitive exam preparation.",
};

export default function ResourcesPage() {
  return (
    <main className="section">
      <div className="container">
        <div className="eyebrow">Resources</div>
        <h1 style={{fontSize:42}}>Preparation resources</h1>
        <p style={{maxWidth:720,color:"var(--muted)"}}>
          The platform is structured to expand into study material, current affairs, guides, discussions and other preparation resources.
        </p>
        <div className="grid" style={{marginTop:28}}>
          <article className="card"><h3>Study material</h3><p>Topic-focused notes and preparation material can be added without changing the mock-test engine.</p></article>
          <article className="card"><h3>Current affairs</h3><p>Current-affairs modules can be connected to the same exam and subject structure.</p></article>
          <article className="card"><h3>Community</h3><p>Discussion, Q&amp;A and forum modules are designed as future extensions of the platform.</p></article>
        </div>
      </div>
    </main>
  );
}
