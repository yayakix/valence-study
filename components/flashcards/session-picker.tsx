"use client";

import { useState } from "react";
import { BookOpen, Lock, Repeat, Shuffle } from "lucide-react";
import { MasteryBar } from "@/components/common/mastery-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudyProgress } from "@/hooks/useStudyProgress";
import { cn } from "@/lib/utils";
import { useStartSession } from "./use-start-session";


export function SessionPicker() {
  const data = useStudyProgress();
  const startSession = useStartSession();
  const [chosen, setChosen] = useState<number | null>(null);
  const sectionId = chosen ?? data.frontier.section.id;
  const selected = data.sections.find((s) => s.section.id === sectionId)!;
  const hasHistory = data.stats.totalReviews > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" /> Learn a section
          </CardTitle>
          <CardDescription>
            Each session draws up to {data.settings.sessionSize} cards: anything due first, then the cards you know least.
            Cards you miss come back a few cards later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Section">
            {data.sections.map(({ section, unlocked, mastery }) => (
              <button
                key={section.id}
                type="button"
                role="radio"
                aria-checked={section.id === sectionId}
                aria-label={`Section ${section.id}: ${section.title}${unlocked ? "" : " (locked)"}`}
                disabled={!unlocked}
                onClick={() => setChosen(section.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors",
                  "hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border",
                  section.id === sectionId && "border-primary bg-accent",
                )}
              >
                <span className="font-mono text-sm font-semibold">
                  {unlocked ? `${section.from.symbol}–${section.to.symbol}` : <Lock className="size-4" />}
                </span>
                <span className="text-muted-foreground">
                  {unlocked ? `${Math.round(mastery.masteredRatio * 100)}%` : `#${section.id}`}
                </span>
              </button>
            ))}
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                Section {selected.section.id}: {selected.section.title}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {selected.mastery.mastered}/{selected.mastery.total}
              </span>
            </div>
            <MasteryBar mastery={selected.mastery} threshold={data.unlockThreshold} className="mt-2" />
          </div>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => startSession("learn", sectionId)}>
            Start section {sectionId}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-primary" /> Spaced review
            </CardTitle>
            <CardDescription>
              {data.stats.dueNow > 0
                ? `${data.stats.dueNow} card${data.stats.dueNow === 1 ? "" : "s"} due now across your unlocked sections.`
                : "Nothing is due. Reviews appear here on the day each card is scheduled."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled={data.stats.dueNow === 0} onClick={() => startSession("review")}>
              Review due cards
            </Button>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="size-4 text-primary" /> Cumulative review
            </CardTitle>
            <CardDescription>
              Mixes cards from every unlocked section so early elements stay fresh, weakest cards first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled={!hasHistory} onClick={() => startSession("cumulative")}>
              Start cumulative review
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
