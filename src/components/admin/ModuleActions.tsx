"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateModule, deleteModule } from "@/server/actions/modules";

export function ModuleActions({
  moduleId,
  isPublished,
}: {
  moduleId: string;
  isPublished: boolean;
}) {
  const [pending, start] = useTransition();

  const togglePublish = () =>
    start(async () => {
      try {
        await updateModule({ id: moduleId, isPublished: !isPublished });
        toast.success(
          !isPublished ? "Module publié" : "Module retiré de la publication",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec");
      }
    });

  const onDelete = () => {
    if (!confirm("Supprimer définitivement ce module ?")) return;
    start(async () => {
      try {
        await deleteModule(moduleId);
        toast.success("Module supprimé");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={togglePublish}
      >
        {isPublished ? "Dépublier" : "Publier"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={onDelete}
      >
        Supprimer
      </Button>
    </div>
  );
}
