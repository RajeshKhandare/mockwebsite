import { calculateScore } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function scoreAttempt(attemptId: string, owner: { userId: string | null; guestToken: string | null }) {
  const supabase = createSupabaseAdminClient();

  const { data: attempt, error: attemptError } = await supabase
    .from("test_attempts")
    .select("id,user_id,guest_token,test_template_id,status,started_at")
    .eq("id", attemptId).single();

  if (attemptError || !attempt || (owner.userId ? attempt.user_id !== owner.userId : attempt.guest_token !== owner.guestToken)) {
    return { ok: false as const, status: 404, error: "Attempt not found." };
  }
  if (attempt.status === "expired" || attempt.status === "abandoned") return { ok: false as const, status: 409, error: "This attempt is no longer active." };
  if (attempt.status === "submitted") {
    const { data: existing } = await supabase.from("results").select("*").eq("attempt_id", attemptId).maybeSingle();
    if (existing) return { ok: true as const, alreadySubmitted: true, result: existing };
    return { ok: false as const, status: 409, error: "This attempt was submitted but its result is unavailable." };
  }

  const { data: template, error: templateError } = await supabase
    .from("test_templates").select("marks_per_question,negative_marks,duration_seconds").eq("id", attempt.test_template_id).single();
  if (templateError || !template) return { ok: false as const, status: 500, error: "Test configuration is unavailable." };

  const { data: attemptQuestions, error: questionError } = await supabase
    .from("test_attempt_questions").select("question_id").eq("attempt_id", attemptId);
  if (questionError) return { ok: false as const, status: 500, error: "Attempt questions could not be loaded." };

  const questionIds = (attemptQuestions ?? []).map((row) => row.question_id);
  if (!questionIds.length) return { ok: false as const, status: 422, error: "This attempt has no questions." };

  const [{ data: answers }, { data: correctRows, error: optionError }, { data: questionMeta, error: metadataError }] = await Promise.all([
    supabase.from("test_answers").select("question_id,selected_option").eq("attempt_id", attemptId),
    supabase.from("question_options").select("question_id,option_index").in("question_id", questionIds).eq("is_correct", true),
    supabase.from("questions").select("id,topic_id,section_id,subject_id").in("id", questionIds),
  ]);
  if (optionError) return { ok: false as const, status: 500, error: "Answer key could not be loaded." };
  if (metadataError) return { ok: false as const, status: 500, error: "Question metadata could not be loaded." };

  const correct: Record<string, number> = {};
  for (const row of correctRows ?? []) correct[row.question_id] = row.option_index;
  const answerMap: Record<string, number> = {};
  for (const row of answers ?? []) if (row.selected_option !== null) answerMap[row.question_id] = row.selected_option;

  const calculated = calculateScore({
    answers: answerMap, correct,
    marksPerQuestion: Number(template.marks_per_question),
    negativeMarks: Number(template.negative_marks),
  });

  const sectionMetrics: Record<string, { total:number; correct:number; incorrect:number; unattempted:number }> = {};
  const topicMetrics: Record<string, { total:number; correct:number; incorrect:number; unattempted:number }> = {};
  for (const question of questionMeta ?? []) {
    const selected = answerMap[question.id];
    const correctAnswer = correct[question.id];
    const update = (target: Record<string, {total:number;correct:number;incorrect:number;unattempted:number}>, key: string | null) => {
      if (!key) return;
      const stats = target[key] ?? { total:0, correct:0, incorrect:0, unattempted:0 };
      stats.total += 1;
      if (selected === undefined) stats.unattempted += 1;
      else if (selected === correctAnswer) stats.correct += 1;
      else stats.incorrect += 1;
      target[key] = stats;
    };
    update(sectionMetrics, question.section_id);
    update(topicMetrics, question.topic_id);
  }

  const submittedAt = new Date().toISOString();
  const startedAtMs = Date.parse(attempt.started_at);
  const timeTaken = Math.min(Number(template.duration_seconds), Math.max(0, Math.floor((Date.parse(submittedAt)-startedAtMs)/1000)));

  const { data: finalized, error: finalizeError } = await supabase.from("test_attempts")
    .update({
      status:"submitted", submitted_at:submittedAt, duration_seconds:Number(template.duration_seconds),
      score:calculated.score, accuracy:calculated.accuracy, attempted_count:calculated.correctCount+calculated.incorrectCount,
      correct_count:calculated.correctCount, incorrect_count:calculated.incorrectCount, unattempted_count:calculated.unattemptedCount,
    }).eq("id",attemptId).eq("status","in_progress").select("id").maybeSingle();
  if (finalizeError) return { ok:false as const,status:500,error:"Attempt could not be finalized." };

  if (!finalized) {
    const { data: existing } = await supabase.from("results").select("*").eq("attempt_id",attemptId).maybeSingle();
    if (existing) return { ok:true as const,alreadySubmitted:true,result:existing };
    return { ok:false as const,status:409,error:"This attempt is no longer active." };
  }

  const result = {
    attempt_id:attemptId, correct_count:calculated.correctCount, incorrect_count:calculated.incorrectCount,
    unattempted_count:calculated.unattemptedCount, score:calculated.score, accuracy:calculated.accuracy,
    time_taken_seconds:timeTaken, section_metrics:sectionMetrics, topic_metrics:topicMetrics,
    score_breakdown:{
      marksPerQuestion:Number(template.marks_per_question), negativeMarks:Number(template.negative_marks),
      attempted:calculated.correctCount+calculated.incorrectCount, totalQuestions:questionIds.length,
    },
  };
  const { error: resultError } = await supabase.from("results").upsert(result,{onConflict:"attempt_id"});
  if (resultError) return { ok:false as const,status:500,error:"Result could not be saved." };

  if (owner.userId) {
    const { data: previous } = await supabase.from("performance_stats").select("*").eq("user_id",owner.userId).maybeSingle();
    const previousAttempts=Number(previous?.attempts_count??0), previousCompleted=Number(previous?.completed_count??0);
    const previousAccuracy=Number(previous?.average_accuracy??0), previousScore=Number(previous?.average_score??0);
    await supabase.from("performance_stats").upsert({
      user_id:owner.userId, attempts_count:previousAttempts+1, completed_count:previousCompleted+1,
      average_accuracy:((previousAccuracy*previousCompleted)+calculated.accuracy)/(previousCompleted+1),
      average_score:((previousScore*previousCompleted)+calculated.score)/(previousCompleted+1),
      total_time_seconds:Number(previous?.total_time_seconds??0)+timeTaken, updated_at:submittedAt,
    },{onConflict:"user_id"});

    for (const [topicId, stats] of Object.entries(topicMetrics)) {
      const { data: old } = await supabase.from("performance_topic_stats").select("*").eq("user_id",owner.userId).eq("topic_id",topicId).maybeSingle();
      const attempts=Number(old?.attempts_count??0)+1;
      const answered=stats.correct+stats.incorrect;
      const accuracy=answered>0?(stats.correct/answered)*100:0;
      const oldAttempts=Number(old?.attempts_count??0);
      const oldAccuracy=Number(old?.average_accuracy??0);
      await supabase.from("performance_topic_stats").upsert({
        user_id:owner.userId, topic_id:topicId, attempts_count:attempts,
        questions_attempted:Number(old?.questions_attempted??0)+answered,
        correct_count:Number(old?.correct_count??0)+stats.correct,
        incorrect_count:Number(old?.incorrect_count??0)+stats.incorrect,
        unattempted_count:Number(old?.unattempted_count??0)+stats.unattempted,
        average_accuracy:((oldAccuracy*oldAttempts)+accuracy)/attempts,
        updated_at:submittedAt,
      },{onConflict:"user_id,topic_id"});
    }
  }

  return { ok:true as const,alreadySubmitted:false,result };
}
