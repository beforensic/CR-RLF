import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ModuleForm } from "@/components/admin/ModuleForm";
import { ModuleActions } from "@/components/admin/ModuleActions";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage() {
  const modules = await db.module.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true } } },
  });

  return (
    <div className="space-y-6">
      <ModuleForm />

      <Card>
        <CardHeader>
          <CardTitle>Modules ({modules.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Titre</TH>
                <TH>Slug</TH>
                <TH>Leçons</TH>
                <TH>Statut</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {modules.map((m) => (
                <TR key={m.id}>
                  <TD className="font-medium">
                    <Link
                      href={`/admin/modules/${m.id}`}
                      className="hover:underline"
                    >
                      {m.title}
                    </Link>
                  </TD>
                  <TD className="text-muted-foreground font-mono text-xs">
                    {m.slug}
                  </TD>
                  <TD>{m._count.lessons}</TD>
                  <TD>
                    {m.isPublished ? (
                      <Badge tone="success">Publié</Badge>
                    ) : (
                      <Badge tone="warning">Brouillon</Badge>
                    )}
                  </TD>
                  <TD className="text-right">
                    <ModuleActions
                      moduleId={m.id}
                      isPublished={m.isPublished}
                    />
                  </TD>
                </TR>
              ))}
              {modules.length === 0 && (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun module.
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
