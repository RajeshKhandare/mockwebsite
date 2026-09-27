"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ExamRef = { name?: string; slug?: string };
type StageRef = { name?: string; slug?: string; exams?: ExamRef | ExamRef[] };
type TestTemplate = {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  test_type: string;
  question_count: number;
  duration_seconds: number;
  marks_per_question: number;
  negative_marks: number;
  supported_languages: string[];
  requires_login: boolean;
  exam_stages: StageRef | StageRef[] | null;
};

function getContext(test: TestTemplate) {
  const stage = Array.isArray(test.exam_stages) ? test.exam_stages[0] : test.exam_stages;
  const exam = stage?.exams;
  const examName = Array.isArray(exam) ? exam[0]?.name : exam?.name;
  return { stage, examName };
}

export default function TestsCatalogue() {
  const [tests, setTests] = useState<TestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase
      .from("test_templates")
      .select("id,slug,title,description,test_type,question_count,duration_seconds,marks_per_question,negative_marks,supported_languages,requires_login,exam_stages(name,slug,exams(name,slug))")
      .eq("is_active", true)
      .order("title")
      .then(({ data, error: queryError }) => {
        if (!mounted) return;
        if (queryError) {
          setError(true);
          setLoading(false);
          return;
        }
        setTests((data ?? []) as unknown as TestTemplate[]);
        setLoading(false);
      })
      .then(undefined, () => {
        if (!mounted) return;
        setError(true);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const types = useMemo(() => Array.from(new Set(tests.map((test) => test.test_type))), [tests]);
  const filteredTests = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tests.filter((test) => {
      const { stage, examName } = getContext(test);
      const haystack = [test.title, test.description, test.test_type, stage?.name, examName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (type === "all" || test.test_type === type) && (!needle || haystack.includes(needle));
    });
  }, [q, tests, type]);

  return (
    <>
      <form
        className="test-filter-bar"
        onSubmit={(event) => event.preventDefault()}
        role="search"
        aria-label="Mock test filters"
      >
        <input
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search tests or exams…"
          aria-label="Search mock tests"
        />
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          aria-label="Filter by test type"
        >
          <option value="all">All test types</option>
          {types.map((value) => (
            <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">Filter</button>
        {(q || type !== "all") && (
          <button className="btn btn-secondary" type="button" onClick={() => { setQ(""); setType("all"); }}>
            Clear
          </button>
        )}
      </form>

      <div className="test-filter-pills">
        <button type="button" className={type === "all" ? "active" : ""} onClick={() => setType("all")}>All</button>
        {types.map((value) => (
          <button key={value} type="button" className={type === value ? "active" : ""} onClick={() => setType(value)}>
            {value.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid test-card-grid" aria-live="polite">
          {Array.from({ length: 3 }).map((_, index) => (
            <article className="card test-card" key={index}>
              <div className="skeleton-line" />
              <div className="skeleton-line wide" />
              <div className="skeleton-line" />
              <div className="skeleton-line wide" />
            </article>
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <h2>Mock-test catalogue temporarily unavailable</h2>
          <p className="muted">Please refresh the page shortly. Your account and test data are not affected.</p>
        </div>
      ) : (
        <div className="grid test-card-grid">
          {filteredTests.map((test, index) => {
            const { stage, examName } = getContext(test);
            return (
              <article className="card test-card" key={test.id}>
                <div className="test-card-top">
                  <span className="test-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="badge">{test.requires_login ? "Account" : "Free to try"}</span>
                </div>
                <div className="eyebrow">{test.test_type.replaceAll("_", " ")}</div>
                <h3>{test.title}</h3>
                <p className="test-context">
                  {examName ?? "Exam preparation"}{stage?.name ? " · " + stage.name : ""}
                </p>
                <p>{test.description}</p>
                <div className="meta">
                  <span className="badge">{test.question_count} questions</span>
                  <span className="badge">{Math.round(test.duration_seconds / 60)} min</span>
                  <span className="badge">{test.question_count * Number(test.marks_per_question)} marks</span>
                  <span className="badge">−{test.negative_marks}</span>
                </div>
                <div className="test-card-footer">
                  <span>{test.supported_languages.map((language) => language.toUpperCase()).join(" · ")}</span>
                  <Link className="btn btn-primary" href={"/test/" + (test.slug ?? test.id)}>View test</Link>
                </div>
              </article>
            );
          })}
          {!filteredTests.length && (
            <div className="card empty-state">
              <strong>No tests match your filters.</strong>
              <span>Try another search or clear the filters to see all published tests.</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
