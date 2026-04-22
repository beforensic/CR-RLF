"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLesson } from "@/server/actions/modules";

export function LessonForm({ moduleId }: { moduleId: string }) {
  const [pending, start] = useTransition();

  const onSubmit = (fd: FormData) => {
    start(async () => {
      try {
        await createLesson({
          moduleId,
          slug: String(fd.get("slug") ?? ""),
          title: String(fd.get("title") ?? ""),
          content: String(fd.get("content") ?? ""),
          videoUrl: (String(fd.get("videoUrl") ?? "") || null) as string | null,
          order: Number(fd.get("order") ?? 0),
        });
        toast.success("Leçon ajoutée");
        (document.getElementById("lesson-form") as HTMLFormElement)?.reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une leçon</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="lesson-form" action={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="l-title">Titre</Label>
              <Input id="l-title" name="title" required maxLength={160} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="l-slug">Slug</Label>
              <Input
                id="l-slug"
                name="slug"
                required
                pattern="[a-z0-9-]+"
                maxLength={80}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="l-order">Ordre</Label>
              <Input id="l-order" name="order" type="number" min={0} defaultValue={0} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="l-videoUrl">URL vidéo (optionnel)</Label>
              <Input
                id="l-videoUrl"
                name="videoUrl"
                type="url"
                placeholder="https://youtu.be/…"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="l-content">Contenu (markdown)</Label>
              <textarea
                id="l-content"
                name="content"
                required
                rows={8}
                maxLength={50_000}
                className="flex w-full rounded-md border bg-card px-3 py-2 text-sm font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={pending}>
              {pending ? "Ajout…" : "Ajouter la leçon"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
