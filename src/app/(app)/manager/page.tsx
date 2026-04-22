import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ManagerHome() {
  const manager = await requireRole(["ADMIN", "MANAGER"]);

  const learners = await db.user.findMany({
    where:
      manager.role === "ADMIN"
        ? { role: "LEARNER" }
        : { role: "LEARNER", managedById: manager.id },
    orderBy: { name: "asc" },
  });

  const [publishedLessons, progresses, attempts] = await Promise.all([
    db.lesson.findMany({
      where: { module: { isPublished: true } },
      select: { id: true },
    }),
    db.lessonProgress.findMany({
      where: {
        userId: { in: learners.map((l) => l.id) },
        completedAt: { not: null },
      },
      select: { userId: true },
    }),
    db.quizAttempt.findMany({
      where: { userId: { in: learners.map((l) => l.id) } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: true, quiz: { include: { lesson: true } } },
    }),
  ]);

  const totalLessons = publishedLessons.length || 1;
  const perUser = new Map<string, number>();
  for (const p of progresses) {
    perUser.set(p.userId, (perUser.get(p.userId) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Espace manager</h1>
        <p className="text-sm text-muted-foreground">
          {manager.role === "ADMIN"
            ? "Vue consolidée de tous les apprenants."
            : "Progression des apprenants qui vous sont rattachés."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apprenants ({learners.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {learners.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              Aucun apprenant rattaché.
            </p>
          ) : (
            learners.map((l) => {
              const done = perUser.get(l.id) ?? 0;
              const pct = (done / totalLessons) * 100;
              return (
                <div key={l.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      {l.name}
                      {!l.isActive && <Badge tone="warning">désactivé</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {l.email}
                    </div>
                  </div>
                  <div className="w-64">
                    <Progress value={pct} />
                    <div className="text-xs text-muted-foreground mt-1">
                      {done} / {totalLessons} leçons
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Derniers quiz</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {attempts.map((a) => (
              <div
                key={a.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.quiz.lesson.title} ·{" "}
                    {new Date(a.createdAt).toLocaleString("fr-BE")}
                  </div>
                </div>
                <Badge tone={a.passed ? "success" : "warning"}>
                  {a.score}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        <Link href="/manager/learners" className="underline">
          Voir le détail par apprenant →
        </Link>
      </div>
    </div>
  );
}
