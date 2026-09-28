import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Preparation Resources | MockTest",
  description: "Practical mock-test strategies, revision checklists, speed practice guidance and performance review resources for exam preparation.",
};

const resources = [
  {
    title: "Mock-test strategy",
    label: "Start here",
    text: "Take a timed test first, then review every incorrect and unattempted question. Use the result to decide what to practise next instead of repeating the same test immediately.",
  },
  {
    title: "How to review a score",
    label: "Performance",
    text: "Look beyond the total score. Compare accuracy, attempted questions, time spent and subject-level performance to find whether the main issue is knowledge, speed or question selection.",
  },
  {
    title: "Speed-practice routine",
    label: "10 minutes",
    text: "Use short timed sessions to build pace. Start with a comfortable question count, review mistakes, and gradually increase the number of questions you can handle accurately.",
  },
  {
    title: "Sectional preparation",
    label: "Subject focus",
    text: "Use sectional tests to isolate one area at a time. A focused session makes it easier to identify weak topics before returning to a full mock.",
  },
  {
    title: "Post-test checklist",
    label: "Review",
    text: "After every submission, record the questions you guessed, the questions you skipped, repeated mistakes and any time-consuming patterns worth revisiting.",
  },
  {
    title: "Multilingual preparation",
    label: "English · Hindi · Marathi",
    text: "Choose the supported test language before starting. Keep your terminology and revision notes consistent with the language you use during practice.",
  },
];

export default function ResourcesPage() {
  return (
    <main className="section resources-page">
      <div className="container">
        <div className="section-header resources-hero">
          <div>
            <div className="eyebrow">Preparation resources</div>
            <h1>Turn every mock test into a better study plan.</h1>
            <p>
              Use these practical guides alongside the mock-test library to prepare,
              review your performance and choose your next practice session with a clear purpose.
            </p>
          </div>
          <Link className="btn btn-primary" href="/tests">Browse mock tests</Link>
        </div>

        <section className="resource-grid" aria-label="Preparation guides">
          {resources.map((item, index) => (
            <Link className="card resource-card" href={index === 0 ? "/tests" : index === 1 ? "/dashboard/analytics" : index === 2 ? "/test/banking-speed-10m" : index === 3 ? "/practice" : "/tests"} prefetch={false} key={item.title}>
              <span className="resource-label">{item.label}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
              <div className="resource-card-meta">
                <span>{index === 0 ? "Choose → Test → Review" : index === 1 ? "Score · accuracy · time" : index === 2 ? "5 · 10 · 15 · 20 questions" : index === 3 ? "Subject-focused" : index === 4 ? "After every submission" : "English · Hindi · Marathi"}</span>
              </div>
              <span className="resource-card-action">Open related practice →</span>
            </Link>
          ))}
        </section>

        <section className="resource-workflow">
          <div>
            <div className="eyebrow">A simple preparation loop</div>
            <h2>Prepare → Test → Review → Repeat</h2>
            <p className="muted">
              A mock is most useful when the review changes what you do next.
              Keep the loop short and measurable rather than collecting tests without reviewing them.
            </p>
          </div>
          <div className="resource-steps">
            <div><strong>01</strong><span>Choose the right exam, stage or subject.</span></div>
            <div><strong>02</strong><span>Take a timed mock under exam-style conditions.</span></div>
            <div><strong>03</strong><span>Review score, accuracy, time and missed questions.</span></div>
            <div><strong>04</strong><span>Practise the weak area, then take another test.</span></div>
          </div>
        </section>

        <section className="resource-links">
          <div className="section-header">
            <div>
              <div className="eyebrow">Explore the platform</div>
              <h2>Use the right workspace for the next step.</h2>
            </div>
          </div>
          <div className="grid resource-link-grid">
            <Link className="card" href="/exams"><h3>Exam library</h3><p>Start from a category and move through exam, stage, subject and test.</p><span className="card-link">Browse exams →</span></Link>
            <Link className="card" href="/tests"><h3>Mock-test library</h3><p>Compare published full mocks, sectional tests and focused practice.</p><span className="card-link">See tests →</span></Link>
            <Link className="card" href="/practice"><h3>Practice workspace</h3><p>Move from broad mocks to subject-focused preparation.</p><span className="card-link">Open practice →</span></Link>
            <Link className="card" href="/dashboard/analytics"><h3>Performance analytics</h3><p>Signed-in students can review attempt history and performance trends.</p><span className="card-link">Open analytics →</span></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
