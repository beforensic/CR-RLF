"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TR, TD } from "@/components/ui/table";
import { updateUser } from "@/server/actions/users";

type Manager = { id: string; name: string };

export function UserRow({
  user,
  managers,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MANAGER" | "LEARNER";
    isActive: boolean;
    managedById: string | null;
  };
  managers: Manager[];
}) {
  const [pending, start] = useTransition();

  const change = (fields: Parameters<typeof updateUser>[0]) =>
    start(async () => {
      try {
        await updateUser(fields);
        toast.success("Mis à jour");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec");
      }
    });

  return (
    <TR>
      <TD>
        <div className="font-medium">{user.name}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TD>
      <TD>
        <Select
          value={user.role}
          disabled={pending}
          onChange={(e) =>
            change({
              userId: user.id,
              role: e.target.value as "ADMIN" | "MANAGER" | "LEARNER",
            })
          }
        >
          <option value="LEARNER">Apprenant</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Administrateur</option>
        </Select>
      </TD>
      <TD>
        {user.role === "LEARNER" ? (
          <Select
            value={user.managedById ?? ""}
            disabled={pending}
            onChange={(e) =>
              change({
                userId: user.id,
                managedById: e.target.value || null,
              })
            }
          >
            <option value="">— aucun —</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        ) : (
          <span className="text-muted-foreground text-xs">n/a</span>
        )}
      </TD>
      <TD>
        {user.isActive ? (
          <Badge tone="success">Actif</Badge>
        ) : (
          <Badge tone="warning">Désactivé</Badge>
        )}
      </TD>
      <TD className="text-right">
        <Button
          size="sm"
          variant={user.isActive ? "destructive" : "outline"}
          disabled={pending}
          onClick={() =>
            change({ userId: user.id, isActive: !user.isActive })
          }
        >
          {user.isActive ? "Désactiver" : "Réactiver"}
        </Button>
      </TD>
    </TR>
  );
}
