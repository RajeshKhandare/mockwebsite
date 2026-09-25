import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateScore } from "@/lib/scoring";

const payloadSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
  correct: z.record(z.string(), z.number().int().min(0).max(3)),
  marksPerQuestion: z.number().positive(),
  negativeMarks: z.number().nonnegative(),
});

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid scoring payload" }, { status: 400 });
  return NextResponse.json(calculateScore(parsed.data));
}
