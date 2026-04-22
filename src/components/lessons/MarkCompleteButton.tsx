"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markLessonCompleted } from "@/server/actions/progress";

export function MarkCompleteButton({
  lessonId,
  moduleSlug,
  completed,
}: {
  lessonId: string;
  moduleSlug: string;
  completed: boolean;
}) {
  const [pending, start] = useTransition();

  if (completed) {
    return (
      <Button variant="outline" disabled>
        <CheckCircle2 className="h-4 w-4 text-success" />
        Leçon terminée
      </Button>
    );
  }

  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await markLessonCompleted({ lessonId, moduleSlug });
            toast.success("Leçon marquée comme terminée");
          } catch {
            toast.error("Impossible d'enregistrer la progression");
          }
        })
      }
    >
      Marquer comme terminée
    </Button>
  );
}
