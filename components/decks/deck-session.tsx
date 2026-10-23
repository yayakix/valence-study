"use client";

import { useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { useDeck } from "@/hooks/useDeck";
import { DeckFlashcard } from "./deck-flashcard";

type DeckApi = ReturnType<typeof useDeck>;

export function DeckSession({ api, active }: { api: DeckApi; active: NonNullable<DeckApi["active"]> }) {
  const { card, revealed, progress, isRepeat } = active;
  const next = () => api.rate("good");
  const missed = () => api.rate("again");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, button, [role=dialog]")) return;
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowRight") {
        event.preventDefault();
        if (revealed) next();
        else api.reveal();
      } else if (revealed && (event.key === "x" || event.key === "1")) {
        event.preventDefault();
        missed();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!card) return null;

  return (
    <div className="flex flex-col gap-4">
      <Progress value={progress.ratio * 100} aria-label="Round progress" className="h-1" />
      <DeckFlashcard
        key={`${card.id}-${progress.completed}`}
        card={card}
        revealed={revealed}
        onReveal={api.reveal}
        onNext={next}
        isRepeat={isRepeat}
      />
      {revealed ? (
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button size="lg" variant="outline" className="h-12 text-base" onClick={missed}>
            <X data-icon="inline-start" /> Missed it
          </Button>
          <Button size="lg" className="h-12 text-base" onClick={next}>
            Next <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      ) : (
        <Button size="lg" className="h-12 w-full text-base" onClick={api.reveal}>
          Show answer
        </Button>
      )}
      <p className="hidden text-center text-xs text-muted-foreground sm:block">
        Space flips, then goes to the next card · X if you missed it
      </p>
    </div>
  );
}
