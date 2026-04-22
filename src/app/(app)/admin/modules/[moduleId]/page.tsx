import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { LessonForm } from "@/components/admin/LessonForm";
import { ModuleActions } from "@/components/admin/ModuleActions";

export const dynamic = "force-dynamic";

export default async function AdminModuleDetail({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { quiz: { select: { id: true, _count: { select: { questions: true } } } } },
      },
    },
  });
  if (!mod) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/modules"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Modules
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h2 className="text-xl font-semibold tracking-tight">{mod.title}</h2>
          {mod.isPublished ? (
            <Badge tone="success">Publié</Badge>
          ) : (
            <Badge tone="warning">Brouillon</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Slug : <code>{mod.slug}</code>
        </p>
        <div className="mt-3">
          <ModuleActions moduleId={mod.id} isPublished={mod.isPublished} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leçons ({mod.lessons.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>#</TH>
                <TH>Titre</TH>
                <TH>Slug</TH>
                <TH>Quiz</TH>
              </TR>
            </THead>
            <TBody>
              {mod.lessons.map((l, i) => (
                <TR key={l.id}>
                  <TD>{i + 1}</TD>
                  <TD className="font-medium">{l.title}</TD>
                  <TD className="text-muted-foreground font-mono text-xs">
                    {l.slug}
                  </TD>
                  <TD>
                    {l.quiz ? (
                      <Badge tone="neutral">
                        {l.quiz._count.questions} questions
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TD>
                </TR>
              ))}
              {mod.lessons.length === 0 && (
                <TR>
                  <TD colSpan={4} className="text-center text-muted-foreground py-6">
                    Aucune leçon.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <LessonForm moduleId={mod.id} />

      <p className="text-xs text-muted-foreground">
        Les quiz sont créés via le script <code>prisma/seed.ts</code> ou Prisma
        Studio. Un éditeur UI complet pourra être ajouté ultérieurement.
      </p>
    </div>
  );
}
