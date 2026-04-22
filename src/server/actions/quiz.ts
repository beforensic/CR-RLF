"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const submitSchema = z.object({
  quizId: z.string().cuid(),
  moduleSlug: z.string().min(1),
  lessonSlug: z.string().min(1),
  answers: z.record(z.string(), z.array(z.string())),
});

type QuestionOption = { id: string; label: string; isCorrect: boolean };

export async function submitQuiz(input: z.infer<typeof submitSchema>) {
  const user = await requireUser();
  const { quizId, moduleSlug, lessonSlug, answers } = submitSchema.parse(input);

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      lesson: { include: { module: true } },
    },
  });
  if (!quiz || !quiz.lesson.module.isPublished) {
    throw new Error("Quiz introuvable");
  }

  let correct = 0;
  for (const q of quiz.questions) {
    const opts = (q.options as unknown as QuestionOption[]) ?? [];
    const correctIds = opts.filter((o) => o.isCorrect).map((o) => o.id).sort();
    const given = [...(answers[q.id] ?? [])].sort();
    const match =
      correctIds.length === given.length &&
      correctIds.every((v, i) => v === given[i]);
    if (match) correct++;
  }

  const total = quiz.questions.length || 1;
  const score = Math.round((correct / total) * 100);
  const passed = score >= quiz.passScore;

  await db.$transaction([
    db.quizAttempt.create({
      data: {
        quizId,
        userId: user.id,
        score,
        passed,
        answers,
      },
    }),
    ...(passed
      ? [
          db.lessonProgress.upsert({
            where: {
              userId_lessonId: { userId: user.id, lessonId: quiz.lessonId },
            },
            create: {
              userId: user.id,
              lessonId: quiz.lessonId,
              completedAt: new Date(),
            },
            update: { completedAt: new Date() },
          }),
        ]
      : []),
  ]);

  await logAudit({
    actorId: user.id,
    action: "quiz.submit",
    target: quizId,
    metadata: { score, passed },
  });

  revalidatePath(`/modules/${moduleSlug}`);
  revalidatePath(`/modules/${moduleSlug}/lessons/${lessonSlug}`);
  revalidatePath("/dashboard");

  return { score, passed, passScore: quiz.passScore };
}
