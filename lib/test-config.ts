export type TestType = "full_mock" | "sectional" | "subject" | "topic" | "daily" | "practice" | "mixed" | "custom" | "weak_topic";
export type SupportedLanguage = "en" | "hi" | "mr";

export type TestConfig = {
  id: string;
  title: string;
  examSlug: string;
  stageSlug: string;
  type: TestType;
  questionCount: number;
  durationSeconds: number;
  marksPerQuestion: number;
  negativeMarks: number;
  languages: SupportedLanguage[];
};

export const demoTests: TestConfig[] = [
  { id: "banking-prelims-01", title: "Banking Prelims Full Mock", examSlug: "banking", stageSlug: "prelims", type: "full_mock", questionCount: 100, durationSeconds: 3600, marksPerQuestion: 1, negativeMarks: 0.25, languages: ["en","hi","mr"] },
  { id: "reasoning-sectional-01", title: "Reasoning Sectional Test", examSlug: "banking", stageSlug: "prelims", type: "sectional", questionCount: 35, durationSeconds: 1200, marksPerQuestion: 1, negativeMarks: 0.25, languages: ["en","hi","mr"] },
];
