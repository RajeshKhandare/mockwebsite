"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Test = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  test_type: string;
  question_count: number;
  duration_seconds: number;
  marks_per_question: number;
  supported_languages: string[];
  requires_login: boolean;
  selection_rules: { variant?: string; catalog_order?: number; difficulty?: Record<string, number>; difficulty_focus?: string; phase?: string } | null;
};

function category(test: Test) {
  const v = test.selection_rules?.variant;
  if (v === "level_1" || test.selection_rules?.difficulty_focus === "easy") return "easy";
  if (v === "level_2" || test.selection_rules?.difficulty_focus === "medium") return "medium";
  if (v === "level_3" || test.selection_rules?.difficulty_focus === "hard") return "hard";
  return "mixed";
}

export default function TestCatalogue({ tests }: { tests: Test[] }) {
  const [filter, setFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const filtered = useMemo(() => {
    const visible = filter === "all" ? tests : tests.filter((test) => category(test) === filter);
    return [...visible].sort((a, b) => Number(a.selection_rules?.catalog_order ?? 99) - Number(b.selection_rules?.catalog_order ?? 99));
  }, [filter, tests]);

  return (
    <>
      <div className="test-filter-pills" aria-label="Question difficulty">
        {([
          ["all", "All tests"],
          ["easy", "Easy"],
          ["medium", "Medium"],
          ["hard", "Hard"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        Difficulty filters show only tests whose prepared question set matches that level. Mixed/full mocks are shown under All tests.
      </p>

      <div className="grid">
        {filtered.map((test) => {
          const label = category(test) === "easy" ? "Easy · 100 Questions" :
            category(test) === "medium" ? "Medium · 100 Questions" :
            category(test) === "hard" ? "Hard · 100 Questions" : "Mixed Mock · 100 Questions";
          return (
            <article className="card test-card" key={test.id}>
              <div className="test-card-top">
                <span className="test-index">{category(test).slice(0, 1).toUpperCase()}</span>
                
              </div>
              <div className="eyebrow">{label}</div>
              <h3>{test.title}</h3>
              <p>{test.description ?? "Structured practice for this exam."}</p>
              <div className="meta">
                <span className="badge">{test.question_count} questions</span>
                <span className="badge">{Math.round(test.duration_seconds / 60)} min</span>
              </div>
              <div className="test-card-footer">
                <span>{test.supported_languages.map((language) => language === "en" ? "English" : language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : language.toUpperCase()).join(" · ")}</span>
                <Link className="btn btn-primary" href={"/test/" + (test.slug ?? test.id)}>
                  Start test
                </Link>
              </div>
            </article>
          );
        })}
        {!filtered.length && (
          <div className="card empty-state">
            <strong>No prepared {filter} 100-question tests are published yet.</strong>
            <span>This is intentional: incomplete difficulty banks are never filled with mixed-difficulty questions.</span>
          </div>
        )}
      </div>
    </>
  );
}
