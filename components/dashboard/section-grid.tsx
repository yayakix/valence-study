"use client";

import { Check, Lock, Play } from "lucide-react";
import { MasteryBar } from "@/components/common/mastery-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SectionProgress } from "@/hooks/useStudyProgress";
import { catalog } from "@/controllers";
import { cn } from "@/lib/utils";

export function SectionGrid({
  sections,
  unlockThreshold,
  onStudy,
}: {
  sections: SectionProgress[];
  unlockThreshold: number;
  onStudy: (sectionId: number) => void;
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Sections">
      {sections.map(({ section, unlocked, isFrontier, mastery, dueCount }) => {
        const symbols = section.atomicNumbers.map((n) => catalog.elements[n - 1]!.symbol);
        const complete = mastery.masteredRatio >= unlockThreshold;
        return (
          <li
            key={section.id}
            data-testid={`section-${section.id}`}
            data-unlocked={unlocked}
            className={cn(
              "flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors",
              isFrontier && "border-primary/50 ring-1 ring-primary/20",
              !unlocked && "bg-muted/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-medium text-muted-foreground">
                  Section {section.id} · {section.from.atomicNumber}–{section.to.atomicNumber}
                </div>
                <h3 className={cn("truncate font-semibold", !unlocked && "text-muted-foreground")}>
                  {section.title}
                </h3>
              </div>
              {!unlocked ? (
                <Lock className="mt-1 size-4 shrink-0 text-muted-foreground" aria-label="Locked" />
              ) : complete ? (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Check /> Mastered
                </Badge>
              ) : isFrontier ? (
                <Badge className="shrink-0">Current</Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-1" aria-hidden>
              {symbols.map((symbol) => (
                <span
                  key={symbol}
                  className={cn(
                    "grid h-6 min-w-7 place-items-center rounded border bg-background px-1 font-mono text-xs",
                    !unlocked && "text-muted-foreground/60",
                  )}
                >
                  {symbol}
                </span>
              ))}
            </div>

            <div className="mt-auto space-y-2">
              <MasteryBar mastery={mastery} threshold={unlocked ? unlockThreshold : undefined} />
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {unlocked
                    ? `${mastery.mastered}/${mastery.total} mastered${dueCount > 0 ? ` · ${dueCount} due` : ""}`
                    : `Unlocks after section ${section.id - 1}`}
                </span>
                {unlocked && (
                  <Button size="sm" variant={isFrontier ? "default" : "outline"} onClick={() => onStudy(section.id)}>
                    <Play data-icon="inline-start" />
                    Study
                  </Button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
