"use client";

import Link from "next/link";
import { PartyPopper, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { catalog } from "@/controllers";
import { RECALL_RATINGS, type SessionSummary } from "@/domain/study/types";
import { useStartSession } from "./use-start-session";
import { MODE_LABELS } from "./labels";

const RATING_LABEL = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" } as const;

export function SessionComplete({ summary, onDismiss }: { summary: SessionSummary; onDismiss: () => void }) {
  const startSession = useStartSession();
  const unlocked = catalog.sections.filter((s) => summary.unlockedSectionIds.includes(s.id));
  const accuracy = Math.round(summary.accuracy * 100);
  const minutes = Math.max(1, Math.round((summary.completedAt - summary.startedAt) / 60_000));

  return (
    <div className="mx-auto max-w-xl space-y-4" data-testid="session-complete">
      <Card>
        <CardHeader className="text-center">
          <PartyPopper className="mx-auto size-8 text-primary" />
          <CardTitle className="text-2xl">Session complete</CardTitle>
          <CardDescription>
            {MODE_LABELS[summary.mode]} · {summary.uniqueCards} cards in about {minutes} min
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-semibold tabular-nums" data-testid="session-accuracy">
              {accuracy}%
            </div>
            <div className="text-sm text-muted-foreground">
              recalled on {summary.correct} of {summary.totalAnswers} answers
            </div>
          </div>
          <dl className="grid grid-cols-4 gap-2 text-center">
            {RECALL_RATINGS.map((rating) => (
              <div key={rating} className="rounded-lg border p-2">
                <dt className="text-xs text-muted-foreground">{RATING_LABEL[rating]}</dt>
                <dd className="text-lg font-semibold tabular-nums">{summary.ratings[rating]}</dd>
              </div>
            ))}
          </dl>
          {unlocked.map((section) => (
            <div
              key={section.id}
              className="flex items-center gap-3 rounded-lg border border-primary/30 bg-accent/60 p-3 text-sm"
            >
              <Unlock className="size-5 shrink-0 text-primary" />
              <div>
                <div className="font-semibold">Section {section.id} unlocked</div>
                <div className="text-muted-foreground">{section.title} is now part of your study plan.</div>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() =>
                startSession(
                  unlocked[0] ? "learn" : summary.mode,
                  unlocked[0]?.id ?? summary.sectionId,
                )
              }
            >
              {unlocked[0] ? `Start section ${unlocked[0].id}` : "Study again"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={onDismiss}>
              Choose another session
            </Button>
          </div>
          <div className="text-center">
            <Button variant="link" nativeButton={false} render={<Link href="/" />}>
              Back to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
