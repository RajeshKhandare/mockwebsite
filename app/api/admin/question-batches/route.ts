import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deterministicQualityScore, hashQuestion, normalizeQuestionText, validateGeneratedQuestion } from "@/lib/question-validation";

const requestSchema = z.object({
  examStageId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  language: z.enum(["en", "hi", "mr"]).default("en"),
  sourceType: z.enum(["original", "ai", "import", "pyq_inspired", "manual"]).default("ai"),
  provider: z.string().trim().max(100).optional(),
  model: z.string().trim().max(150).optional(),
  questions: z.array(z.unknown()).min(1).max(1000),
});

export async function POST(request: Request) {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid question batch." }, { status: 400 });

  const db = createSupabaseAdminClient();
  const { data: batch, error: batchError } = await db.from("question_batches").insert({
    exam_stage_id: parsed.data.examStageId,
    subject_id: parsed.data.subjectId ?? null,
    topic_id: parsed.data.topicId ?? null,
    requested_count: parsed.data.questions.length,
    source_type: parsed.data.sourceType,
    provider: parsed.data.provider ?? null,
    model: parsed.data.model ?? null,
    language: parsed.data.language,
    status: "validating",
    created_by: adminUser.id,
  }).select("id").single();

  if (batchError || !batch) return NextResponse.json({ error: "Question batch could not be created." }, { status: 500 });

  let generated = 0;
  let validated = 0;
  let approved = 0;
  let rejected = 0;
  const review: Array<{ index: number; reason: string }> = [];

  for (let index = 0; index < parsed.data.questions.length; index += 1) {
    const candidateResult = validateGeneratedQuestion(parsed.data.questions[index]);
    if (!candidateResult.ok) {
      rejected += 1;
      review.push({ index, reason: candidateResult.errors.map((error) => error.message).join("; ") });
      continue;
    }

    const candidate = candidateResult.data;
    if (candidate.language !== parsed.data.language) {
      rejected += 1;
      review.push({ index, reason: "Question language does not match the batch language." });
      continue;
    }

    const questionHash = await hashQuestion(candidate.question);
    const { data: existing } = await db.from("questions").select("id").eq("question_hash", questionHash).eq("language", candidate.language).maybeSingle();
    if (existing) {
      rejected += 1;
      review.push({ index, reason: "Duplicate question already exists." });
      continue;
    }

    const qualityScore = deterministicQualityScore(candidate);
    const { data: question, error: questionError } = await db.from("questions").insert({
      exam_stage_id: candidate.examStageId,
      subject_id: candidate.subjectId,
      topic_id: candidate.topicId,
      section_id: candidate.sectionId ?? null,
      language: candidate.language,
      question_text: candidate.question,
      normalized_text: normalizeQuestionText(candidate.question),
      question_hash: questionHash,
      explanation: candidate.explanation,
      difficulty: candidate.difficulty,
      status: "pending",
      source_type: candidate.sourceType,
      source_batch_id: batch.id,
      quality_score: qualityScore,
      quality_confidence: qualityScore,
      validation_status: "validating",
      review_required: true,
    }).select("id").single();

    if (questionError || !question) {
      rejected += 1;
      review.push({ index, reason: "Question could not be stored." });
      continue;
    }

    generated += 1;

    const { error: optionError } = await db.from("question_options").insert(
      candidate.options.map((option, optionIndex) => ({
        question_id: question.id,
        option_index: optionIndex,
        option_text: option,
        is_correct: optionIndex === candidate.correctOption,
      })),
    );

    if (optionError) {
      await db.from("questions").update({ status: "rejected", validation_status: "failed", auto_decision: "rejected" }).eq("id", question.id);
      rejected += 1;
      review.push({ index, reason: "Question options could not be stored." });
      continue;
    }

    const { data: validation, error: validationError } = await db.rpc("validate_question", { question_id_input: question.id });
    if (validationError) {
      await db.from("questions").update({ status: "needs_review", validation_status: "needs_review", auto_decision: "review", review_required: true }).eq("id", question.id);
      review.push({ index, reason: "Automatic validation could not complete." });
      continue;
    }

    validated += 1;
    if (validation?.passed === true) {
      approved += 1;
    } else {
      review.push({ index, reason: "Validation passed structure but needs review before publication." });
    }
  }

  await db.from("question_batches").update({
    generated_count: generated,
    validated_count: validated,
    approved_count: approved,
    rejected_count: rejected,
    status: review.length ? "review" : "completed",
    completed_at: new Date().toISOString(),
  }).eq("id", batch.id);

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    generated,
    validated,
    approved,
    rejected,
    reviewRequired: review,
  });
}
