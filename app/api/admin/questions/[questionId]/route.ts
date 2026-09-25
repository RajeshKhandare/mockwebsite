import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ status: z.enum(["pending", "approved", "rejected"]) });

export async function PATCH(request: Request, context: { params: Promise<{ questionId: string }> }) {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { questionId } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const db = createSupabaseAdminClient();
  const { data: question, error: questionError } = await db
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .single();
  if (questionError || !question) return NextResponse.json({ error: "Question not found." }, { status: 404 });

  const { error } = await db.from("questions").update({ status: parsed.data.status }).eq("id", questionId);
  if (error) return NextResponse.json({ error: "Question status could not be updated." }, { status: 500 });
  return NextResponse.json({ ok: true, status: parsed.data.status });
}
