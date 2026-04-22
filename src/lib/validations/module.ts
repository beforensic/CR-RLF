import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement");

export const moduleInputSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(2000),
  order: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});
export type ModuleInput = z.infer<typeof moduleInputSchema>;

export const lessonInputSchema = z.object({
  moduleId: z.string().cuid(),
  slug: slugSchema,
  title: z.string().min(1).max(160),
  content: z.string().min(1).max(50_000),
  videoUrl: z.string().url().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
});
export type LessonInput = z.infer<typeof lessonInputSchema>;

export const quizAnswerSchema = z.record(z.string(), z.array(z.string()));
export type QuizAnswer = z.infer<typeof quizAnswerSchema>;
