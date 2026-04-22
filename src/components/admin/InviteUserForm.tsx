"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteUser } from "@/server/actions/users";

type Manager = { id: string; name: string; email: string };

export function InviteUserForm({ managers }: { managers: Manager[] }) {
  const [pending, start] = useTransition();
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "LEARNER">("LEARNER");

  const onSubmit = (fd: FormData) => {
    start(async () => {
      try {
        await inviteUser({
          email: String(fd.get("email") ?? ""),
          name: String(fd.get("name") ?? ""),
          role,
          managedById:
            role === "LEARNER"
              ? (String(fd.get("managedById") ?? "") || null)
              : null,
        });
        toast.success("Invitation envoyée");
        (document.getElementById("invite-form") as HTMLFormElement)?.reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de l'invitation");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inviter un utilisateur</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="invite-form" action={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" required maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Rôle</Label>
              <Select
                id="role"
                name="role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "ADMIN" | "MANAGER" | "LEARNER")
                }
              >
                <option value="LEARNER">Apprenant</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Administrateur</option>
              </Select>
            </div>
            {role === "LEARNER" && (
              <div className="space-y-1">
                <Label htmlFor="managedById">Manager rattaché</Label>
                <Select id="managedById" name="managedById">
                  <option value="">— aucun —</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button disabled={pending}>
              {pending ? "Envoi…" : "Envoyer l'invitation"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
