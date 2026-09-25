import { calculateScore } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function scoreAttempt(attemptId: string, userId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: attempt, error: attemptError } = await supabase
    .from("test_attempts")
    .select("id,user_id,test_template_id,status,started_at")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt || attempt.user_id !== userId) {
    return { ok: false as const, status: 404, error: "Attempt not found." };
  }

  if (attempt.status === "expired" || attempt.status === "abandoned") {
    return { ok: false as const, status: 409, error: "This attempt is no longer active." };
  }

  if (attempt.status === "submitted") {
    const { data: existing } = await supabase.from("results").select("*").eq("attempt_id", attemptId).maybeSingle();
    if (existing) return { ok: true as const, alreadySubmitted: true, result: existing };
  }

  const { data: template, error: templateError } = await supabase
    .from("test_templates")
    .select("marks_per_question,negative_marks")
    .eq("id", attempt.test_template_id)
    .single();

  if (templateError || !template) {
    return { ok: false as const, status: 500, error: "Test configuration is unavailable." };
  }

  const { data: attemptQuestions, error: questionError } = await supabase
    .from("test_attempt_questions")
    .select("question_id")
    .eq("attempt_id", attemptId);

  if (questionError) return { ok: false as const, status: 500, error: "Attempt questions could not be loaded." };

  const questionIds = (attemptQuestions ?? []).map((row) => row.question_id);
  if (!questionIds.length) return { ok: false as const, status: 422, error: "This attempt has no questions." };

  const { data: answers } = await supabase
    .from("test_answers")
    .select("question_id,selected_option")
    .eq("attempt_id", attemptId);

  const { data: correctRows, error: optionError } = await supabase
    .from("question_options")
    .select("question_id,option_index")
    .in("question_id", questionIds)
    .eq("is_correct", true);

  if (optionError) return { ok: false as const, status: 500, error: "Answer key could not be loaded." };

  const correct: Record<string, number> = {};
  for (const row of correctRows ?? []) correct[row.question_id] = row.option_index;

  const answerMap: Record<string, number> = {};
  for (const row of answers ?? []) {
    if (row.selected_option !== null) answerMap[row.question_id] = row.selected_option;
  }

  const calculated = calculateScore({
    answers: answerMap,
    correct,
    marksPerQuestion: Number(template.marks_per_question),
    negativeMarks: Number(template.negative_marks),
  });

  const submittedAt = new Date().toISOString();
  const timeTaken = Math.max(
    0,
    Math.floor((Date.parse(submittedAt) - Date.parse(attempt.started_at)) / 1000),
  );

  await supabase.from("test_attempts").update({
    status: "submitted",
    submitted_at: submittedAt,
  }).eq("id", attemptId);

  const result = {
    attempt_id: attemptId,
    correct_count: calculated.correctCount,
    incorrect_count: calculated.incorrectCount,
    unattempted_count: calculated.unattemptedCount,
    score: calculated.score,
    accuracy: calculated.accuracy,
    time_taken_seconds: timeTaken,
  };

  const { error: resultError } = await supabase.from("results").upsert(result, { onConflict: "attempt_id" });
  if (resultError) return { ok: false as const, status: 500, error: "Result could not be saved." };

  const { data: previous } = await supabase
    .from("performance_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const previousAttempts = Number(previous?.attempts_count ?? 0);
  const previousCompleted = Number(previous?.completed_count ?? 0);
  const previousAccuracy = Number(previous?.average_accuracy ?? 0);
  const previousScore = Number(previous?.average_score ?? 0);

  await supabase.from("performance_stats").upsert({
    user_id: userId,
    attempts_count: previousAttempts + 1,
    completed_count: previousCompleted + 1,
    average_accuracy: ((previousAccuracy * previousCompleted) + calculated.accuracy) / (previousCompleted + 1),
    average_score: ((previousScore * previousCompleted) + calculated.score) / (previousCompleted + 1),
    total_time_seconds: Number(previous?.total_time_seconds ?? 0) + timeTaken,
    updated_at: submittedAt,
  }, { onConflict: "user_id" });

  return { ok: true as const, alreadySubmitted: false, result };
}
