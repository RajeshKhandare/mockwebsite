import { z } from "zod";

export const generatedQuestionSchema = z.object({
  question: z.string().trim().min(1).max(10000),
  options: z.array(z.string().trim().min(1).max(3000)).length(4),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1).max(12000),
  language: z.enum(["en", "hi", "mr"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  examStageId: z.string().uuid(),
  subjectId: z.string().uuid(),
  topicId: z.string().uuid(),
  sectionId: z.string().uuid().nullable().optional(),
  sourceType: z.enum(["original", "ai", "import", "pyq_inspired", "manual"]).default("ai"),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export function normalizeQuestionText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

export async function hashQuestion(value: string) {
  const bytes = new TextEncoder().encode(normalizeQuestionText(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validateGeneratedQuestion(input: unknown) {
  const result = generatedQuestionSchema.safeParse(input);
  if (!result.success) return { ok: false as const, errors: result.error.issues };
  const normalized = result.data.options.map(normalizeQuestionText);
  if (new Set(normalized).size !== 4) return { ok: false as const, errors: [{ message: "Options must be unique." }] };
  return { ok: true as const, data: result.data };
}

export function deterministicQualityScore(input: GeneratedQuestion) {
  const optionsUnique = new Set(input.options.map(normalizeQuestionText)).size === 4;
  const structural = optionsUnique ? 100 : 0;
  const explanation = input.explanation.trim().length >= 20 ? 100 : 70;
  const metadata = input.examStageId && input.subjectId && input.topicId ? 100 : 0;
  return Math.round(structural * 0.45 + explanation * 0.2 + metadata * 0.2 + 15);
}
