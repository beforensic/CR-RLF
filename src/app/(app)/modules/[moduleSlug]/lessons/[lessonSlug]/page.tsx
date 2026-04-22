import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkCompleteButton } from "@/components/lessons/MarkCompleteButton";

export const dynamic = "force-dynamic";

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    return null;
  } catch {
    return null;
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}) {
  const { moduleSlug, lessonSlug } = await params;
  const user = await requireUser();

  const lesson = await db.lesson.findFirst({
    where: {
      slug: lessonSlug,
      module: { slug: moduleSlug, isPublished: true },
    },
    include: {
      module: true,
      quiz: { select: { id: true } },
    },
  });
  if (!lesson) notFound();

  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
  });
  const completed = !!progress?.completedAt;
  const youtubeId = lesson.videoUrl ? extractYouTubeId(lesson.videoUrl) : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/modules/${lesson.module.slug}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {lesson.module.title}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          {lesson.title}
        </h1>
      </div>

      {youtubeId ? (
        <div className="aspect-video w-full rounded-lg overflow-hidden border bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={lesson.title}
            className="w-full h-full"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : lesson.videoUrl ? (
        <a
          href={lesson.videoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-block text-accent underline"
        >
          Ouvrir la vidéo →
        </a>
      ) : null}

      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 whitespace-pre-wrap">
          {lesson.content}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <MarkCompleteButton
          lessonId={lesson.id}
          moduleSlug={lesson.module.slug}
          completed={completed}
        />
        {lesson.quiz && (
          <Link
            href={`/modules/${lesson.module.slug}/lessons/${lesson.slug}/quiz`}
            className="text-sm font-medium underline"
          >
            Passer le quiz →
          </Link>
        )}
      </div>
    </div>
  );
}
