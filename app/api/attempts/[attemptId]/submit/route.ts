import { NextResponse } from "next/server";
import { getAttemptOwner } from "@/lib/attempt-owner";
import { scoreAttempt } from "@/lib/attempt-scoring";

export async function POST(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await context.params;
  const owner = await getAttemptOwner();
  if (!owner.userId && !owner.guestToken) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });

  const result = await scoreAttempt(attemptId, owner);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, result: result.result });
}
