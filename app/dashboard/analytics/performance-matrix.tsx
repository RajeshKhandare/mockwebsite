"use client";

import { useMemo, useState } from "react";

type Subject = {
  name: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
};

type Props = {
  score: number;
  accuracy: number;
  averageScore: number;
  averageAccuracy: number;
  bestScore: number;
  timeSeconds: number;
  percentile: number | null;
  correct: number;
  incorrect: number;
  subjects: Subject[];
};

function accuracyOf(subject: Subject) {
  const attempted = subject.correct + subject.incorrect;
  return attempted ? (subject.correct / attempted) * 100 : 0;
}

export default function PerformanceMatrix(props: Props) {
  const [metric, setMetric] = useState<"score" | "correct" | "incorrect" | "accuracy">("score");
  const max = useMemo(() => {
    if (!props.subjects.length) return 100;
    if (metric === "score" || metric === "accuracy") return 100;
    return Math.max(1, props.correct, props.incorrect);
  }, [metric, props.subjects, props.correct, props.incorrect]);

  return (
    <div className="performance-report">
      <section className="report-card overall-performance">
        <div className="report-card-title"><div><p className="eyebrow">Overall performance summary</p><h2>Your latest performance</h2></div><span className="report-badge">Live analysis</span></div>
        <div className="score-banner">
          <div className="score-ring"><strong>{props.score.toFixed(1)}</strong><span>/ 100</span></div>
          <div><span className="report-label">Your score</span><p>Accuracy <strong>{props.accuracy.toFixed(1)}%</strong></p></div>
        </div>
        <div className="report-time-card"><span className="report-icon">◷</span><div><strong>{Math.floor(props.timeSeconds / 60)}:{String(props.timeSeconds % 60).padStart(2, "0")}</strong><span>Time spent</span></div><small>Across your latest completed mock</small></div>
        <div className="report-mini-grid">
          <div><span className="report-icon yellow">☆</span><strong>{props.bestScore.toFixed(1)}</strong><small>Personal best</small></div>
          <div><span className="report-icon red">%</span><strong>{props.averageAccuracy.toFixed(1)}%</strong><small>Average accuracy</small></div>
          <div><span className="report-icon blue">◎</span><strong>{props.percentile === null ? "—" : props.percentile.toFixed(1)}</strong><small>{props.percentile === null ? "Percentile after more attempts" : "Percentile"}</small></div>
        </div>
      </section>

      <section className="report-card comparison-report">
        <div className="report-card-title"><div><p className="eyebrow">Comparison chart</p><h2>Understand your performance</h2><p className="muted">Compare your latest result with the average and highest result available for this test.</p></div></div>
        <div className="comparison-legend"><span><i className="legend-dot you"/>You</span><span><i className="legend-dot average"/>Average</span><span><i className="legend-dot best"/>Best</span></div>
        <div className="metric-switcher">
          {([["score","Your score"],["correct","Correct"],["incorrect","Incorrect"],["accuracy","Accuracy"]] as const).map(([value,label]) =>
            <button key={value} className={metric === value ? "active" : ""} type="button" onClick={() => setMetric(value)}>{label}</button>
          )}
        </div>
        <div className="comparison-chart">
          {[
            ["You", metric === "score" ? props.score : metric === "accuracy" ? props.accuracy : metric === "correct" ? props.correct : props.incorrect, "you"],
            ["Average", metric === "score" ? props.averageScore : metric === "accuracy" ? props.averageAccuracy : 0, "average"],
            ["Best", metric === "score" ? props.bestScore : metric === "accuracy" ? 100 : metric === "correct" ? props.correct : props.incorrect, "best"],
          ].map(([label,value,key]) => {
            const n = Number(value);
            return <div className="comparison-column" key={String(key)}>
              <div className={"comparison-bar " + key} style={{height: Math.max(8, (n / max) * 180)}}><strong>{n.toFixed(1)}</strong></div>
              <b>{label}</b>
            </div>;
          })}
        </div>
        <div className="comparison-note"><strong>{props.score >= props.averageScore ? "Above your current average" : "Below your current average"}</strong><span>Use the subject breakdown below to decide what to practise next.</span></div>
      </section>

      <section className="report-card sectional-report">
        <div className="report-card-title"><div><p className="eyebrow">Sectional summary</p><h2>Subject-wise performance</h2><p className="muted">See which sections are helping your score and which need more practice.</p></div></div>
        {props.subjects.length ? (
          <div className="sectional-table">
            <div className="sectional-head"><span>Subject</span><span>Your score</span><span>Accuracy</span><span>Status</span></div>
            {props.subjects.map((subject) => {
              const accuracy = accuracyOf(subject);
              const score = subject.total ? (subject.correct / subject.total) * 100 : 0;
              return <div className="sectional-row" key={subject.name}>
                <strong>{subject.name}</strong><span>{score.toFixed(1)}</span><span>{accuracy.toFixed(1)}%</span>
                <span className={accuracy >= 70 ? "matrix-positive" : accuracy >= 45 ? "matrix-neutral" : "matrix-negative"}>{accuracy >= 70 ? "Strong" : accuracy >= 45 ? "Needs work" : "Focus here"}</span>
              </div>;
            })}
          </div>
        ) : <div className="empty-state"><strong>Sectional analysis will appear after your next completed test.</strong><span>Your subject metrics are calculated automatically from every submitted attempt.</span></div>}
      </section>
    </div>
  );
}
