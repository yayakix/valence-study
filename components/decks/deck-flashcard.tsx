"use client";

import type { DeckCard } from "@/domain/decks/types";
import { cn } from "@/lib/utils";

function sizeFor(text: string) {
  if (text.length <= 2) return "text-7xl sm:text-8xl font-semibold";
  if (text.length <= 12) return "text-5xl sm:text-6xl font-semibold";
  return "text-3xl sm:text-4xl font-semibold";
}

export function DeckFlashcard({
  card,
  revealed,
  onReveal,
  onNext,
  isRepeat,
}: {
  card: DeckCard;
  revealed: boolean;
  onReveal: () => void;
  onNext: () => void;
  isRepeat: boolean;
}) {
  const face =
    "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-sm [backface-visibility:hidden]";
  return (
    <div className="perspective">
      <button
        type="button"
        onClick={revealed ? onNext : onReveal}
        aria-label={
          revealed
            ? `Answer: ${card.answer}. Tap for the next card.`
            : `${card.question} ${card.front}. Tap to reveal the answer.`
        }
        data-testid="flashcard"
        data-revealed={revealed}
        className={cn(
          "relative block h-72 w-full touch-manipulation rounded-2xl transition-transform duration-500 [transform-style:preserve-3d] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-80",
          revealed && "[transform:rotateY(180deg)]",
        )}
      >
        <div className={face} aria-hidden={revealed}>
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{card.question}</span>
          <span className={sizeFor(card.front)} data-testid="card-prompt">
            {card.front}
          </span>
          <span className="text-xs text-muted-foreground">
            {isRepeat ? "Another try · " : ""}Tap to flip
          </span>
        </div>
        <div className={cn(face, "[transform:rotateY(180deg)] border-primary/30 bg-accent/40")} aria-hidden={!revealed}>
          <span className="text-sm font-medium text-muted-foreground">{card.front}</span>
          <span className={sizeFor(card.answer)} data-testid="card-answer">
            {card.answer}
          </span>
          {card.detail && <span className="max-w-sm text-sm text-muted-foreground">{card.detail}</span>}
          <span className="absolute bottom-4 text-xs text-muted-foreground">Tap for the next card</span>
        </div>
      </button>
    </div>
  );
}
