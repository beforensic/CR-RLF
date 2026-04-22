import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH } from "@/components/ui/table";
import { UserRow } from "@/components/admin/UserRow";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const [users, managers] = await Promise.all([
    db.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] }),
    db.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] }, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Attribution des rôles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Utilisateur</TH>
                <TH>Rôle</TH>
                <TH>Manager rattaché</TH>
                <TH>Statut</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={{
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    isActive: u.isActive,
                    managedById: u.managedById,
                  }}
                  managers={managers}
                />
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
