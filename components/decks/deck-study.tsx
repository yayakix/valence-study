"use client";

import { useEffect, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeck } from "@/hooks/useDeck";
import { cn } from "@/lib/utils";
import { DeckProgressPanel } from "./deck-progress-panel";
import { DeckRangePicker } from "./deck-range-picker";
import { DeckSession } from "./deck-session";

export function DeckStudy({ deckId }: { deckId: string }) {
  const api = useDeck(deckId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { ready, active, lastSummary, startRound, dismissSummary } = api;

  useEffect(() => {
    if (!ready || active) return;
    if (lastSummary) {
      toast.success(`Round complete: ${lastSummary.correct} of ${lastSummary.totalAnswers} right`, {
        description: "Starting the next round.",
      });
      dismissSummary();
      return;
    }
    startRound();
  }, [ready, active, lastSummary, startRound, dismissSummary]);

  const label = active?.session.mode === "review" ? "Due for review" : api.rangeLabel;

  return (
    <div className="space-y-12">
      <div className="mx-auto w-full max-w-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-expanded={pickerOpen}
            aria-controls="deck-range"
            onClick={() => setPickerOpen((open) => !open)}
            className="flex h-9 touch-manipulation items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <span className="sr-only">Change what you practice, currently </span>
            {label}
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", pickerOpen && "rotate-180")} />
          </button>
          {active && (
            <span className="text-sm text-muted-foreground tabular-nums" data-testid="session-counter">
              {active.progress.completed + 1} / {active.progress.total}
            </span>
          )}
        </div>

        {pickerOpen && ready && <DeckRangePicker api={api} onDone={() => setPickerOpen(false)} />}

        {active ? (
          <DeckSession api={api} active={active} />
        ) : (
          <div role="status" className="flex flex-col gap-4">
            <span className="sr-only">Loading your cards…</span>
            <Skeleton className="h-1 w-full" />
            <Skeleton className="h-72 w-full rounded-2xl sm:h-80" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
      </div>

      {ready && <DeckProgressPanel api={api} />}
    </div>
  );
}
