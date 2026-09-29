import { NextResponse } from "next/server";
import { getAttemptOwner } from "@/lib/attempt-owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await context.params;
  const owner = await getAttemptOwner();
  if (!owner.userId && !owner.guestToken) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });

  const supabase = createSupabaseAdminClient();
  const { data: attempt, error } = await supabase
    .from("test_attempts")
    .select("id,status,started_at,test_template_id,user_id,guest_token,duration_seconds")
    .eq("id", attemptId)
    .single();

  if (error || !attempt || (owner.userId ? attempt.user_id !== owner.userId : attempt.guest_token !== owner.guestToken)) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "This attempt is no longer active." }, { status: 409 });
  }

  const { data: template, error: templateError } = await supabase
    .from("test_templates")
    .select("duration_seconds")
    .eq("id", attempt.test_template_id)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: "Test configuration is unavailable." }, { status: 500 });
  }

  // The countdown is a client-side preparation period. The authoritative test clock
  // starts here, immediately before the student sees the live test controls.
  const startedAt = new Date().toISOString();
  const { data: startedAttempt, error: updateError } = await supabase
    .from("test_attempts")
    .update({ started_at: startedAt, duration_seconds: template.duration_seconds })
    .eq("id", attemptId)
    .eq("status", "in_progress")
    .is("started_at", null)
    .select("started_at,duration_seconds")
    .maybeSingle();

  if (updateError) {
    console.error("Test clock start failed", updateError);
    return NextResponse.json({ error: "Could not start the test clock." }, { status: 500 });
  }

  // If another request already started the attempt, return its authoritative
  // timestamp instead of silently resetting the browser countdown.
  if (!startedAttempt) {
    const { data: existing } = await supabase
      .from("test_attempts")
      .select("started_at,duration_seconds,status")
      .eq("id", attemptId)
      .single();

    if (!existing?.started_at || existing.status !== "in_progress") {
      return NextResponse.json({ error: "Could not start the test clock." }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      startedAt: existing.started_at,
      durationSeconds: existing.duration_seconds ?? template.duration_seconds,
      alreadyStarted: true,
    });
  }

  return NextResponse.json({
    ok: true,
    startedAt: startedAttempt.started_at,
    durationSeconds: startedAttempt.duration_seconds ?? template.duration_seconds,
    alreadyStarted: false,
  });
}
