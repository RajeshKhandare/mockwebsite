import { describe, expect, it } from "vitest";
import { deterministicQualityScore, normalizeQuestionText, validateGeneratedQuestion } from "./question-validation";

const base = {
  question:"What is 20% of 100?",
  options:["20","10","30","40"],
  correctOption:0,
  explanation:"Twenty percent of 100 is 20.",
  language:"en" as const,
  difficulty:"easy" as const,
  examStageId:"11111111-1111-4111-8111-111111111111",
  subjectId:"22222222-2222-4222-8222-222222222222",
  topicId:"33333333-3333-4333-8333-333333333333",
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
