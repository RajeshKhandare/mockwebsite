import { describe, expect, it } from "vitest";
import { calculateScore } from "./scoring";

describe("calculateScore", () => {
  it("calculates positive, negative and unattempted responses", () => {
    expect(calculateScore({
      answers: { a: 0, b: 2 },
      correct: { a: 0, b: 1, c: 2 },
      marksPerQuestion: 1,
      negativeMarks: 0.25,
    })).toEqual({
      correctCount: 1,
      incorrectCount: 1,
      unattemptedCount: 1,
      attempted: 2,
      score: 0.75,
      accuracy: 50,
    });
  });
});
