export type ScoringInput = {
  answers: Record<string, number>;
  correct: Record<string, number>;
  marksPerQuestion: number;
  negativeMarks: number;
};

export function calculateScore(input: ScoringInput) {
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  for (const questionId of Object.keys(input.correct)) {
    const answer = input.answers[questionId];
    if (answer === undefined) unattemptedCount++;
    else if (answer === input.correct[questionId]) correctCount++;
    else incorrectCount++;
  }

  const score = correctCount * input.marksPerQuestion - incorrectCount * input.negativeMarks;
  const attempted = correctCount + incorrectCount;
  const accuracy = attempted === 0 ? 0 : (correctCount / attempted) * 100;

  return { correctCount, incorrectCount, unattemptedCount, attempted, score, accuracy };
}
