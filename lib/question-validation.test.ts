import { describe, expect, it } from "vitest";
import { validateGeneratedQuestion } from "./question-validation";

describe("generated question validation", () => {
  it("requires exactly four unique options", () => {
    const base = { question:"Q", options:["A","B","C","D"], correctOption:0, explanation:"E", language:"en", difficulty:"medium", examStage:"prelims", subject:"reasoning", topic:"analogy" };
    expect(validateGeneratedQuestion(base).ok).toBe(true);
    expect(validateGeneratedQuestion({...base, options:["A","A","C","D"]}).ok).toBe(false);
  });
});
