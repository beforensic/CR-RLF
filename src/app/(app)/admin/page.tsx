import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [userCount, modCount, lessonCount, attemptCount, activeUsers] =
    await Promise.all([
      db.user.count(),
      db.module.count(),
      db.lesson.count(),
      db.quizAttempt.count(),
      db.user.count({ where: { isActive: true } }),
    ]);

  const stats = [
    { label: "Utilisateurs", value: userCount, sub: `${activeUsers} actifs` },
    { label: "Modules", value: modCount },
    { label: "Leçons", value: lessonCount },
    { label: "Tentatives quiz", value: attemptCount },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {s.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{s.value}</div>
            {s.sub && (
              <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
