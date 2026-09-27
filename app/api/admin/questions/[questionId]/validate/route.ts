import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, context: { params: Promise<{ questionId: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { questionId } = await context.params;
  const db = createSupabaseAdminClient();
  const { data, error } = await db.rpc("validate_question", { question_id_input: questionId });
  if (error) return NextResponse.json({ error: "Automatic validation failed." }, { status: 500 });

  return NextResponse.json({ ok: true, validation: data });
}
