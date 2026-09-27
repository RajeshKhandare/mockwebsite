import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  status: z.enum(["pending", "approved", "rejected", "needs_review", "archived"]),
  notes: z.string().trim().max(2000).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ questionId: string }> }) {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { questionId } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid question update." }, { status: 400 });

  const db = createSupabaseAdminClient();
  const { data: question, error: questionError } = await db
    .from("questions")
    .select("id,status")
    .eq("id", questionId)
    .single();
  if (questionError || !question) return NextResponse.json({ error: "Question not found." }, { status: 404 });

  const nextStatus = parsed.data.status;
  const { error } = await db.from("questions").update({
    status: nextStatus,
    review_required: nextStatus !== "approved",
    approved_at: nextStatus === "approved" ? new Date().toISOString() : null,
    approved_by: nextStatus === "approved" ? adminUser.id : null,
    updated_at: new Date().toISOString(),
  }).eq("id", questionId);
  if (error) return NextResponse.json({ error: "Question status could not be updated." }, { status: 500 });

  await db.from("question_reviews").insert({
    question_id: questionId,
    reviewer_id: adminUser.id,
    action: nextStatus === "approved" ? "approve" : nextStatus === "rejected" ? "reject" : nextStatus === "archived" ? "retire" : "request_review",
    from_status: question.status,
    to_status: nextStatus,
    notes: parsed.data.notes ?? null,
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
