import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: attempt, error } = await supabase
    .from("test_attempts")
    .select("id,status,language,started_at,test_template_id")
    .eq("id", attemptId).eq("user_id", user.id).single();

  if (error || !attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });

  const { data: template } = await supabase
    .from("test_templates")
    .select("title,question_count,duration_seconds,marks_per_question,negative_marks")
    .eq("id", attempt.test_template_id).single();

  const { data: links, error: linksError } = await supabase
    .from("test_attempt_questions")
    .select("question_id,position")
    .eq("attempt_id", attemptId)
    .order("position", { ascending: true });

  if (linksError) return NextResponse.json({ error: "Questions could not be loaded." }, { status: 500 });

  const ids = (links ?? []).map((row) => row.question_id);
  if (!ids.length) return NextResponse.json({ error: "This attempt has no questions." }, { status: 422 });

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id,question_text,explanation")
    .in("id", ids)
    .eq("language", attempt.language);

  if (questionsError) return NextResponse.json({ error: "Question content could not be loaded." }, { status: 500 });

  const { data: options, error: optionsError } = await supabase
    .from("question_options")
    .select("id,question_id,option_index,option_text")
    .in("question_id", ids)
    .order("option_index", { ascending: true });

  if (optionsError) return NextResponse.json({ error: "Question options could not be loaded." }, { status: 500 });

  const { data: answers, error: answersError } = await supabase
    .from("test_answers")
    .select("question_id,selected_option,marked_for_review")
    .eq("attempt_id", attemptId);

  if (answersError) return NextResponse.json({ error: "Saved answers could not be loaded." }, { status: 500 });

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));
  const optionMap = new Map<string, typeof options>();
  for (const option of options ?? []) {
    const current = optionMap.get(option.question_id) ?? [];
    current.push(option);
    optionMap.set(option.question_id, current);
  }

  const result = (links ?? []).map((link) => {
    const question = questionMap.get(link.question_id);
    return question ? {
      id: question.id,
      position: link.position,
      text: question.question_text,
      options: (optionMap.get(question.id) ?? []).map((option) => ({
        id: option.id, index: option.option_index, text: option.option_text,
      })),
    } : null;
  }).filter(Boolean);

  return NextResponse.json({
    attempt,
    template,
    questions: result,
    answers: answers ?? [],
  });
}
