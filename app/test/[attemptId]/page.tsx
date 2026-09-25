import Link from "next/link";

export default async function TestPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <main className="section"><div className="container" style={{maxWidth:820}}>
    <div className="eyebrow">Test instructions</div><h1 style={{fontSize:42}}>Banking Prelims Full Mock</h1>
    <div className="card"><h3>Before you begin</h3><ul style={{lineHeight:1.9,color:"var(--muted)"}}><li>Choose the language for this test: English, Hindi or Marathi.</li><li>Read all instructions before starting the timed attempt.</li><li>Your answers are submitted to the server for scoring.</li><li>Do not refresh or close the test window during an active attempt.</li></ul>
      <label htmlFor="language" style={{display:"block",fontWeight:700,margin:"22px 0 8px"}}>Test language</label>
      <select id="language" defaultValue="en" style={{width:"100%",height:46,border:"1px solid var(--border)",borderRadius:8,padding:"0 12px",background:"white"}}><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option></select>
      <div className="meta"><span className="badge">100 questions</span><span className="badge">60 minutes</span><span className="badge">100 marks</span><span className="badge">Negative marking configurable</span></div>
      <Link className="btn btn-primary" href={`/test/${attemptId}/session`}>Start test</Link>
    </div>
  </div></main>;
}
