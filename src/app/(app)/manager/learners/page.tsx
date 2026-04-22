import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function LearnersPage() {
  const manager = await requireRole(["ADMIN", "MANAGER"]);

  const learners = await db.user.findMany({
    where:
      manager.role === "ADMIN"
        ? { role: "LEARNER" }
        : { role: "LEARNER", managedById: manager.id },
    include: {
      progresses: { where: { completedAt: { not: null } } },
      quizAttempts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const totalLessons = await db.lesson.count({
    where: { module: { isPublished: true } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Détail des apprenants
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{learners.length} apprenant(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Nom</TH>
                <TH>Email</TH>
                <TH>Progression</TH>
                <TH>Dernier quiz</TH>
                <TH>Statut</TH>
              </TR>
            </THead>
            <TBody>
              {learners.map((l) => {
                const completed = l.progresses.length;
                const pct = totalLessons
                  ? Math.round((completed / totalLessons) * 100)
                  : 0;
                const last = l.quizAttempts[0];
                return (
                  <TR key={l.id}>
                    <TD className="font-medium">{l.name}</TD>
                    <TD className="text-muted-foreground">{l.email}</TD>
                    <TD>
                      {completed}/{totalLessons} ({pct}%)
                    </TD>
                    <TD>
                      {last ? (
                        <span>
                          {last.score}%{" "}
                          <span className="text-muted-foreground text-xs">
                            · {new Date(last.createdAt).toLocaleDateString("fr-BE")}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TD>
                    <TD>
                      {l.isActive ? (
                        <Badge tone="success">Actif</Badge>
                      ) : (
                        <Badge tone="warning">Désactivé</Badge>
                      )}
                    </TD>
                  </TR>
                );
              })}
              {learners.length === 0 && (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun apprenant.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
