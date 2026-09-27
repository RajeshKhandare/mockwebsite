import { describe, expect, it } from "vitest";
import { deterministicQualityScore, normalizeQuestionText, validateGeneratedQuestion } from "./question-validation";

const base = {
  question:"What is 20% of 100?",
  options:["20","10","30","40"],
  correctOption:0,
  explanation:"Twenty percent of 100 is 20.",
  language:"en" as const,
  difficulty:"easy" as const,
  examStageId:"00000000-0000-0000-0000-000000000001",
  subjectId:"00000000-0000-0000-0000-000000000002",
  topicId:"00000000-0000-0000-0000-000000000003",
  sourceType:"ai" as const,
};

describe("generated question validation",()=>{
  it("requires exactly four unique options",()=>{
    expect(validateGeneratedQuestion(base).ok).toBe(true);
    expect(validateGeneratedQuestion({...base,options:["20","20","30","40"]}).ok).toBe(false);
  });
  it("normalizes whitespace and casing",()=>{
    expect(normalizeQuestionText("  What   IS  20%? ")).toBe("what is 20%?");
  });
  it("produces a high deterministic quality score for a complete candidate",()=>{
    expect(deterministicQualityScore(base)).toBeGreaterThanOrEqual(90);
  });
});
