"use client";

import { Repeat, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { MasteryBar } from "@/components/common/mastery-bar";
import { Button } from "@/components/ui/button";
import type { useDeck } from "@/hooks/useDeck";
import { cn } from "@/lib/utils";

type DeckApi = ReturnType<typeof useDeck>;

export function DeckProgressPanel({ api }: { api: DeckApi }) {
  const { deck, sections, mastery, dueCount, range } = api;
  if (!mastery) return null;

  const reviewDue = () => {
    if (!api.start({ mode: "review" }).ok) toast.error("Nothing is due right now.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const practice = (section: (typeof sections)[number]) => {
    api.setRange(section.range);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="your-progress" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="your-progress" className="text-lg font-semibold">
            Your progress
          </h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {mastery.mastered} of {mastery.total} cards mastered · a card is mastered after 3 correct recalls in a row
          </p>
        </div>
        <Button size="sm" variant={dueCount > 0 ? "default" : "outline"} disabled={dueCount === 0} onClick={reviewDue}>
          <Repeat data-icon="inline-start" />
          {dueCount > 0 ? `Review ${dueCount} due` : "Nothing due"}
        </Button>
      </div>
      <MasteryBar mastery={mastery} className="h-2.5" />
      <ul className="divide-y rounded-xl border bg-card">
        {sections.map((section) => {
          const current = range?.start === section.range.start && range?.end === section.range.end;
          return (
            <li key={section.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className={cn("w-16 shrink-0 text-sm font-medium", current && "text-primary")}>{section.title}</span>
              <MasteryBar mastery={section.mastery} className="flex-1" />
              <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {section.mastery.mastered}/{section.mastery.total}
              </span>
              <Button size="xs" variant="ghost" onClick={() => practice(section)} aria-label={`Practice ${section.title}`}>
                Practice
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          if (window.confirm(`Reset all progress for ${deck.shortTitle}?`)) void api.reset();
        }}
      >
        <RotateCcw data-icon="inline-start" /> Reset {deck.shortTitle} progress
      </Button>
    </section>
  );
}
