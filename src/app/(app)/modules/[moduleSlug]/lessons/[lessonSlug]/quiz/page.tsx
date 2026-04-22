import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export const dynamic = "force-dynamic";

type StoredOption = { id: string; label: string; isCorrect: boolean };

export default async function QuizPage({
  params,
}: {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}) {
  const { moduleSlug, lessonSlug } = await params;
  await requireUser();

  const lesson = await db.lesson.findFirst({
    where: { slug: lessonSlug, module: { slug: moduleSlug, isPublished: true } },
    include: {
      module: true,
      quiz: { include: { questions: { orderBy: { order: "asc" } } } },
    },
  });
  if (!lesson || !lesson.quiz) notFound();

  const questions = lesson.quiz.questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    type: (q.type === "multi" ? "multi" : "single") as "single" | "multi",
    // Strip isCorrect before sending to the client
    options: ((q.options as unknown as StoredOption[]) ?? []).map((o) => ({
      id: o.id,
      label: o.label,
    })),
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/modules/${moduleSlug}/lessons/${lessonSlug}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {lesson.title}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          Quiz — {lesson.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Seuil de réussite : {lesson.quiz.passScore}%
        </p>
      </div>

      <QuizRunner
        quizId={lesson.quiz.id}
        moduleSlug={moduleSlug}
        lessonSlug={lessonSlug}
        questions={questions}
        passScore={lesson.quiz.passScore}
      />
    </div>
  );
}
