import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const user = await requireUser();
  const [modules, progresses] = await Promise.all([
    db.module.findMany({
      where: { isPublished: true },
      include: { lessons: { select: { id: true } } },
      orderBy: { order: "asc" },
    }),
    db.lessonProgress.findMany({
      where: { userId: user.id, completedAt: { not: null } },
      select: { lessonId: true },
    }),
  ]);
  const done = new Set(progresses.map((p) => p.lessonId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Modules</h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez un module pour accéder à ses leçons et quiz.
        </p>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aucun module publié pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((m) => {
            const completed = m.lessons.filter((l) => done.has(l.id)).length;
            const pct = m.lessons.length
              ? (completed / m.lessons.length) * 100
              : 0;
            return (
              <Link key={m.id} href={`/modules/${m.slug}`} className="group">
                <Card className="group-hover:border-foreground/30 transition h-full">
                  <CardHeader>
                    <CardTitle>{m.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {m.description}
                    </p>
                    <Progress value={pct} />
                    <p className="text-xs text-muted-foreground">
                      {completed} / {m.lessons.length} leçons
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
