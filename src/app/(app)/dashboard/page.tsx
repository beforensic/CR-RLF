import Link from "next/link";
import { requireUser, ROLE_LABELS } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const [modules, progresses, attempts] = await Promise.all([
    db.module.findMany({
      where: { isPublished: true },
      include: { lessons: { select: { id: true } } },
      orderBy: { order: "asc" },
    }),
    db.lessonProgress.findMany({
      where: { userId: user.id, completedAt: { not: null } },
      select: { lessonId: true },
    }),
    db.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { quiz: { include: { lesson: true } } },
    }),
  ]);

  const completedIds = new Set(progresses.map((p) => p.lessonId));
  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
  const completed = modules.reduce(
    (a, m) => a + m.lessons.filter((l) => completedIds.has(l.id)).length,
    0,
  );
  const pct = totalLessons ? (completed / totalLessons) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABELS[user.role]}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {user.name.split(" ")[0]}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression globale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={pct} />
          <p className="text-sm text-muted-foreground">
            {completed} / {totalLessons} leçons terminées
          </p>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-3">Modules</h2>
        {modules.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Aucun module publié pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((m) => {
              const done = m.lessons.filter((l) => completedIds.has(l.id)).length;
              const modulePct = m.lessons.length
                ? (done / m.lessons.length) * 100
                : 0;
              return (
                <Link
                  key={m.id}
                  href={`/modules/${m.slug}`}
                  className="block group"
                >
                  <Card className="group-hover:border-foreground/30 transition">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {m.title}
                        {modulePct === 100 && (
                          <Badge tone="success">Terminé</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {m.description}
                      </p>
                      <Progress value={modulePct} />
                      <p className="text-xs text-muted-foreground">
                        {done} / {m.lessons.length} leçons
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {attempts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Derniers quiz</h2>
          <Card>
            <CardContent className="divide-y">
              {attempts.map((a) => (
                <div
                  key={a.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{a.quiz.lesson.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString("fr-BE")}
                    </div>
                  </div>
                  <Badge tone={a.passed ? "success" : "warning"}>
                    {a.score}% {a.passed ? "réussi" : "à rejouer"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
