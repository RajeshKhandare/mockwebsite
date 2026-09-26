import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAttemptOwner } from "@/lib/attempt-owner";

const payloadSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.number().int().min(0).max(3).nullable(),
  markedForReview: z.boolean().optional().default(false),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await context.params;
  const { userId, guestToken } = await getAttemptOwner();
  if (!userId && !guestToken) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  const supabase = createSupabaseAdminClient();

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answer." }, { status: 400 });

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("id,status,started_at,test_template_id,user_id,guest_token")
    .eq("id", attemptId)
    .single();

  if (!attempt || (userId ? attempt.user_id !== userId : attempt.guest_token !== guestToken)) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
  if (attempt.status !== "in_progress") return NextResponse.json({ error: "This attempt is no longer active." }, { status: 409 });

  const { data: template } = await supabase
    .from("test_templates")
    .select("duration_seconds")
    .eq("id", attempt.test_template_id)
    .single();

  if (!template) return NextResponse.json({ error: "Test configuration is unavailable." }, { status: 500 });

  const elapsedSeconds = Math.floor((Date.now() - Date.parse(attempt.started_at)) / 1000);
  if (elapsedSeconds >= Number(template.duration_seconds)) {
    return NextResponse.json({ error: "Time is over. Your attempt will be submitted automatically." }, { status: 409 });
  }

  const { data: linkedQuestion } = await supabase
    .from("test_attempt_questions")
    .select("question_id")
    .eq("attempt_id", attemptId)
    .eq("question_id", parsed.data.questionId)
    .maybeSingle();

  if (!linkedQuestion) return NextResponse.json({ error: "Question is not part of this attempt." }, { status: 400 });

  if (parsed.data.selectedOption !== null) {
    const admin = createSupabaseAdminClient();
    const { data: selectedOption } = await admin
      .from("question_options")
      .select("option_index")
      .eq("question_id", parsed.data.questionId)
      .eq("option_index", parsed.data.selectedOption)
      .maybeSingle();

    if (!selectedOption) return NextResponse.json({ error: "Selected option is invalid." }, { status: 400 });
  }

  const { error } = await supabase.from("test_answers").upsert({
    attempt_id: attemptId,
    question_id: parsed.data.questionId,
    selected_option: parsed.data.selectedOption,
    marked_for_review: parsed.data.markedForReview,
    answered_at: new Date().toISOString(),
  }, { onConflict: "attempt_id,question_id" });

  if (error) return NextResponse.json({ error: "Answer could not be saved." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
