import type { Metadata } from "next";
import TestsCatalogue from "./tests-catalogue";

export const metadata: Metadata = {
  title: "Mock Tests",
  description: "Browse mock tests, sectional tests and focused practice sets for exam preparation.",
};

export const dynamic = "force-static";

export default function TestsPage() {
  return (
    <main className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">Mock tests</div>
            <h1 style={{ fontSize: 42 }}>Practice. Review. Improve.</h1>
            <p>
              Choose a full mock, sectional test or focused practice set. Every test
              shows its exam and stage context before you start.
            </p>
          </div>
          <div className="library-count">
            <strong>Live catalogue</strong>
            <span>published tests</span>
          </div>
        </div>
        <TestsCatalogue />
      </div>
    </main>
  );
}
