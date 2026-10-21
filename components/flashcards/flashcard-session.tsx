"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RECALL_RATINGS, type RecallRating } from "@/domain/study/types";
import { useStudySession } from "@/hooks/useStudySession";
import { Flashcard } from "./flashcard";
import { MODE_LABELS } from "./labels";
import { RatingButtons } from "./rating-buttons";


type ActiveSession = NonNullable<ReturnType<typeof useStudySession>["active"]>;

export function FlashcardSession({ active }: { active: ActiveSession }) {
  const { reveal, rate, end } = useStudySession();
  const { card, revealed, progress, intervalLabels, section, session, isRepeat } = active;

  const handleRate = (rating: RecallRating) => {
    const outcome = rate(rating);
    for (const unlocked of outcome?.newlyUnlocked ?? []) {
      toast.success(`Section ${unlocked.id} unlocked`, { description: `${unlocked.title} is ready to learn.` });
    }
  };

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, [role=dialog]")) return;
      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        reveal();
        return;
      }
      const index = Number(event.key) - 1;
      const rating = RECALL_RATINGS[index];
      if (revealed && rating) {
        event.preventDefault();
        handleRate(rating);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!card) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{MODE_LABELS[session.mode]}</div>
            <div className="truncate text-sm font-semibold">
              {section ? `Section ${section.id} · ${section.title}` : "All unlocked sections"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground tabular-nums" data-testid="session-counter">
              {progress.completed + 1} / {progress.total}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={end} aria-label="End session">
              <X />
            </Button>
          </div>
        </div>
        <Progress value={progress.ratio * 100} aria-label="Session progress" />
      </div>

      <Flashcard key={`${card.id}-${progress.completed}`} card={card} revealed={revealed} onReveal={reveal} isRepeat={isRepeat} />

      <div className="min-h-16">
        {revealed ? (
          <RatingButtons intervals={intervalLabels} onRate={handleRate} />
        ) : (
          <Button size="lg" className="h-12 w-full text-base" onClick={reveal}>
            Show answer
          </Button>
        )}
      </div>
      <p className="hidden text-center text-xs text-muted-foreground sm:block">
        Space reveals · 1 Again · 2 Hard · 3 Good · 4 Easy
      </p>
    </div>
  );
}
