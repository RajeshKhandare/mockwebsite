import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const payloadSchema = z.object({
  testTemplateId: z.string().uuid(),
  language: z.enum(["en", "hi", "mr"]),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid attempt request." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: template, error: templateError } = await admin
    .from("test_templates")
    .select("id,exam_stage_id,question_count,supported_languages,is_active")
    .eq("id", parsed.data.testTemplateId)
    .eq("is_active", true)
    .single();

  if (templateError || !template) return NextResponse.json({ error: "Test not found." }, { status: 404 });
  if (!template.supported_languages.includes(parsed.data.language)) {
    return NextResponse.json({ error: "Selected language is not available for this test." }, { status: 400 });
  }

  const { data: questions, error: questionError } = await admin
    .from("questions")
    .select("id")
    .eq("exam_stage_id", template.exam_stage_id)
    .eq("language", parsed.data.language)
    .eq("status", "approved")
    .limit(Math.min(1000, Math.max(template.question_count * 10, template.question_count)));

  if (questionError || !questions || questions.length < template.question_count) {
    return NextResponse.json({
      error: "This test is not ready yet. The approved question pool is smaller than the configured test size.",
    }, { status: 422 });
  }

  const questionIds = questions.map((question) => question.id);
  const { data: optionRows, error: optionError } = await admin
    .from("question_options")
    .select("question_id,option_index,is_correct")
    .in("question_id", questionIds);

  if (optionError) return NextResponse.json({ error: "Question options could not be validated." }, { status: 500 });

  const optionStats = new Map<string, { count: number; correct: number }>();
  for (const option of optionRows ?? []) {
    const stats = optionStats.get(option.question_id) ?? { count: 0, correct: 0 };
    stats.count += 1;
    if (option.is_correct) stats.correct += 1;
    optionStats.set(option.question_id, stats);
  }

  const readyQuestions = questions.filter((question) => {
    const stats = optionStats.get(question.id);
    return stats?.count === 4 && stats.correct === 1;
  });

  if (readyQuestions.length < template.question_count) {
    return NextResponse.json({ error: "This test is not ready yet. Every live question must have exactly four options and one correct answer." }, { status: 422 });
  }

  const shuffled = [...readyQuestions].sort(() => Math.random() - 0.5).slice(0, template.question_count);
  const { data: attempt, error: attemptError } = await admin
    .from("test_attempts")
    .insert({ user_id: user.id, test_template_id: template.id, language: parsed.data.language })
    .select("id")
    .single();

  if (attemptError || !attempt) return NextResponse.json({ error: "Could not start the test." }, { status: 500 });

  const { error: linkError } = await admin.from("test_attempt_questions").insert(
    shuffled.map((question, index) => ({
      attempt_id: attempt.id,
      question_id: question.id,
      position: index,
    })),
  );

  if (linkError) {
    await admin.from("test_attempts").delete().eq("id", attempt.id);
    return NextResponse.json({ error: "Could not prepare test questions." }, { status: 500 });
  }

  return NextResponse.json({ attemptId: attempt.id });
}
