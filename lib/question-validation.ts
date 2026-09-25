import { z } from "zod";

export const generatedQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  language: z.enum(["en","hi","mr"]),
  difficulty: z.enum(["easy","medium","hard"]),
  examStage: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
});

export function validateGeneratedQuestion(input: unknown) {
  const result = generatedQuestionSchema.safeParse(input);
  if (!result.success) return { ok: false as const, errors: result.error.issues };
  const normalized = result.data.options.map((x) => x.trim().toLocaleLowerCase());
  if (new Set(normalized).size !== 4) return { ok: false as const, errors: [{ message: "Options must be unique." }] };
  return { ok: true as const, data: result.data };
}
