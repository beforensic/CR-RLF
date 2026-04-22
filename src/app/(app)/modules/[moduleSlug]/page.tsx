import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const user = await requireUser();

  const mod = await db.module.findUnique({
    where: { slug: moduleSlug },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { quiz: { select: { id: true } } },
      },
    },
  });
  if (!mod || !mod.isPublished) notFound();

  const progresses = await db.lessonProgress.findMany({
    where: {
      userId: user.id,
      lessonId: { in: mod.lessons.map((l) => l.id) },
    },
  });
  const done = new Map(progresses.map((p) => [p.lessonId, p.completedAt]));
  const completedCount = progresses.filter((p) => p.completedAt).length;
  const pct = mod.lessons.length
    ? (completedCount / mod.lessons.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/modules"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Modules
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          {mod.title}
        </h1>
        <p className="text-muted-foreground mt-1">{mod.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={pct} />
          <p className="text-sm text-muted-foreground">
            {completedCount} / {mod.lessons.length} leçons terminées
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leçons</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {mod.lessons.map((l, i) => {
            const completed = !!done.get(l.id);
            const Icon = completed ? CheckCircle2 : Circle;
            return (
              <Link
                key={l.id}
                href={`/modules/${mod.slug}/lessons/${l.slug}`}
                className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-6 px-6 transition"
              >
                <Icon
                  className={`h-5 w-5 ${completed ? "text-success" : "text-muted-foreground"}`}
                />
                <span className="text-xs text-muted-foreground w-6">
                  {i + 1}.
                </span>
                <span className="font-medium flex-1">{l.title}</span>
                {l.quiz && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <PlayCircle className="h-3.5 w-3.5" /> quiz
                  </span>
                )}
              </Link>
            );
          })}
          {mod.lessons.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">
              Aucune leçon dans ce module.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
