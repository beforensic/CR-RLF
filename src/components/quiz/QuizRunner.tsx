"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitQuiz } from "@/server/actions/quiz";

type QuestionOption = { id: string; label: string };
type Question = {
  id: string;
  prompt: string;
  type: "single" | "multi";
  options: QuestionOption[];
};

export function QuizRunner({
  quizId,
  moduleSlug,
  lessonSlug,
  questions,
  passScore,
}: {
  quizId: string;
  moduleSlug: string;
  lessonSlug: string;
  questions: Question[];
  passScore: number;
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [pending, start] = useTransition();

  const toggle = (q: Question, optionId: string) => {
    setAnswers((prev) => {
      const curr = prev[q.id] ?? [];
      if (q.type === "single") return { ...prev, [q.id]: [optionId] };
      return {
        ...prev,
        [q.id]: curr.includes(optionId)
          ? curr.filter((x) => x !== optionId)
          : [...curr, optionId],
      };
    });
  };

  const onSubmit = () => {
    start(async () => {
      try {
        const res = await submitQuiz({
          quizId,
          moduleSlug,
          lessonSlug,
          answers,
        });
        setResult({ score: res.score, passed: res.passed });
        if (res.passed) toast.success(`Quiz réussi — ${res.score}%`);
        else toast.warning(`Score ${res.score}% — seuil ${res.passScore}%`);
      } catch {
        toast.error("Erreur lors de la soumission");
      }
    });
  };

  const allAnswered = questions.every((q) => (answers[q.id] ?? []).length > 0);

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Résultat
            <Badge tone={result.passed ? "success" : "warning"}>
              {result.score}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {result.passed
              ? "Félicitations, vous avez réussi ce quiz et la leçon est marquée comme terminée."
              : `Score en dessous du seuil de réussite (${passScore}%). Vous pouvez retenter.`}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/modules/${moduleSlug}/lessons/${lessonSlug}`}
              className="underline"
            >
              ← Retour à la leçon
            </Link>
            {!result.passed && (
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                Rejouer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {idx + 1}. {q.prompt}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({q.type === "single" ? "une réponse" : "plusieurs réponses"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((o) => {
              const checked = (answers[q.id] ?? []).includes(o.id);
              return (
                <label
                  key={o.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/60"
                >
                  <input
                    type={q.type === "single" ? "radio" : "checkbox"}
                    name={q.id}
                    checked={checked}
                    onChange={() => toggle(q, o.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{o.label}</span>
                </label>
              );
            })}
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button disabled={!allAnswered || pending} onClick={onSubmit}>
          {pending ? "Envoi…" : "Valider le quiz"}
        </Button>
      </div>
    </div>
  );
}
