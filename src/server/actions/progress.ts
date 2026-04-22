"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";

const markLessonSchema = z.object({
  lessonId: z.string().cuid(),
  moduleSlug: z.string().min(1),
});

export async function markLessonCompleted(input: z.infer<typeof markLessonSchema>) {
  const user = await requireUser();
  const { lessonId, moduleSlug } = markLessonSchema.parse(input);

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson || !lesson.module.isPublished) {
    throw new Error("Leçon introuvable");
  }

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, completedAt: new Date() },
    update: { completedAt: new Date() },
  });

  revalidatePath(`/modules/${moduleSlug}`);
  revalidatePath("/dashboard");
}
