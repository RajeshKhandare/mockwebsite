"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type HomepageExam = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  created_at: string | null;
};

export type HomepageCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  exams: HomepageExam[];
};

const popularSlugs = [
  "ibps-clerk","ibps-po","sbi-clerk","sbi-po",
  "ssc-cgl","ssc-chsl","rrb-ntpc","upsc-civil-services",
  "jee-main","neet-ug","cat","ctet",
];

function ExamCard({ exam, categoryName }: {
  exam: HomepageExam;
  categoryName: string;
}) {
  return (
    <Link className="card exam-card homepage-exam-card" href={"/exams/" + exam.slug}>
      <div className="eyebrow">{categoryName}</div>
      <h3>{exam.name}</h3>
      <p>{exam.description ?? "Structured stages, subjects and mock tests."}</p>
      <span className="card-link">Open exam <b>→</b></span>
    </Link>
  );
}

export default function HomepageExamBrowser({ categories }: { categories: HomepageCategory[] }) {
  const [activeCategory, setActiveCategory] = useState("popular");

  const allExams = useMemo(() => categories.flatMap((category) => category.exams), [categories]);
  const bySlug = useMemo(() => new Map(allExams.map((exam) => [exam.slug, exam])), [allExams]);

  const popular = popularSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as HomepageExam[];
  const popularFallback = allExams.slice(0, 12);
  const popularExams = popular.length >= 6 ? popular : popularFallback;

  const recentExams = useMemo(
    () => [...allExams].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))).slice(0, 12),
    [allExams],
  );

  const selectedCategory = categories.find((category) => category.slug === activeCategory);
  const selectedExams = selectedCategory?.exams ?? [];

  function selectCategory(slug: string) {
    setActiveCategory(slug);
  }

  return (
    <div className="homepage-exam-browser">
      <div className="homepage-category-browser">
        <div className="homepage-category-browser-heading">
          <div>
            <div className="eyebrow">Browse by category</div>
            <h2>Find the exam you are preparing for</h2>
            <p>Choose a category and the exams available in it will appear below—without leaving this section.</p>
          </div>
        </div>

        <div className="homepage-category-tabs" role="tablist" aria-label="Exam categories">
          <button type="button" role="tab" aria-selected={activeCategory === "popular"} className={activeCategory === "popular" ? "active" : ""} onClick={() => selectCategory("popular")}>
            <span className="category-tab-icon">★</span><strong>Popular</strong><small>{popularExams.length}</small>
          </button>
          <button type="button" role="tab" aria-selected={activeCategory === "recent"} className={activeCategory === "recent" ? "active" : ""} onClick={() => selectCategory("recent")}>
            <span className="category-tab-icon">✦</span><strong>Recently Added</strong><small>{recentExams.length}</small>
          </button>
          {categories.map((category) => (
            <button type="button" role="tab" aria-selected={activeCategory === category.slug} className={activeCategory === category.slug ? "active" : ""} onClick={() => selectCategory(category.slug)} key={category.id}>
              <span className="category-tab-icon">{category.name.slice(0, 1)}</span><strong>{category.name}</strong><small>{category.exams.length}</small>
            </button>
          ))}
        </div>

        <section id="homepage-category-results" className="homepage-category-results">
          {activeCategory === "popular" ? (
            <>
              <div className="homepage-results-heading">
                <div><span className="eyebrow">Popular exams</span><h2>What students usually look for</h2></div>
                <Link className="category-view-all" href="/exams"><span>{popularExams.length} featured</span><b>View all exams →</b></Link>
              </div>
              <div className="grid exam-card-grid">
                {popularExams.map((exam) => {
                  const category = categories.find((item) => item.id === exam.category_id);
                  return <ExamCard key={exam.id} exam={exam} categoryName={category?.name ?? "Exam"} />;
                })}
              </div>
            </>
          ) : activeCategory === "recent" ? (
            <>
              <div className="homepage-results-heading">
                <div><span className="eyebrow">Recently added</span><h2>Fresh preparation tracks</h2></div>
                <span>{recentExams.length} recent exams</span>
              </div>
              <div className="grid exam-card-grid">
                {recentExams.map((exam) => {
                  const category = categories.find((item) => item.id === exam.category_id);
                  return <ExamCard key={exam.id} exam={exam} categoryName={category?.name ?? "Exam"} />;
                })}
              </div>
            </>
          ) : selectedCategory ? (
            <>
              <div className="homepage-results-heading">
                <div>
                  <span className="eyebrow">{selectedCategory.name}</span>
                  <h2>{selectedCategory.name} exams</h2>
                  <p>{selectedCategory.description ?? "Choose an exam to continue into its stages and mock tests."}</p>
                </div>
                <Link className="category-view-all" href={"/exams?category=" + selectedCategory.slug}><span>{selectedExams.length} exams</span><b>View full library →</b></Link>
              </div>
              <div className="grid exam-card-grid">
                {selectedExams.map((exam) => <ExamCard key={exam.id} exam={exam} categoryName={selectedCategory.name} />)}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
