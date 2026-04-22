"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createModule } from "@/server/actions/modules";

export function ModuleForm() {
  const [pending, start] = useTransition();

  const onSubmit = (fd: FormData) => {
    start(async () => {
      try {
        await createModule({
          slug: String(fd.get("slug") ?? ""),
          title: String(fd.get("title") ?? ""),
          description: String(fd.get("description") ?? ""),
          order: Number(fd.get("order") ?? 0),
          isPublished: fd.get("isPublished") === "on",
        });
        toast.success("Module créé");
        (document.getElementById("module-form") as HTMLFormElement)?.reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau module</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="module-form" action={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" required maxLength={160} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9-]+"
                maxLength={80}
                placeholder="intro-osint"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                maxLength={2000}
                className="flex w-full rounded-md border bg-card px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="order">Ordre</Label>
              <Input id="order" name="order" type="number" min={0} defaultValue={0} />
            </div>
            <div className="flex items-end gap-2">
              <input
                id="isPublished"
                name="isPublished"
                type="checkbox"
                className="h-4 w-4"
              />
              <Label htmlFor="isPublished">Publier immédiatement</Label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={pending}>
              {pending ? "Création…" : "Créer le module"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
