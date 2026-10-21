"use client";

import type { Flashcard as FlashcardModel } from "@/domain/study/types";
import { cn } from "@/lib/utils";

const PROMPT_STYLE: Record<FlashcardModel["kind"], string> = {
  "symbol-to-name": "font-mono text-7xl sm:text-8xl font-semibold",
  "name-to-symbol": "text-4xl sm:text-5xl font-semibold",
  "number-to-element": "font-mono text-7xl sm:text-8xl font-semibold tabular-nums",
};

export function Flashcard({
  card,
  revealed,
  onReveal,
  isRepeat,
}: {
  card: FlashcardModel;
  revealed: boolean;
  onReveal: () => void;
  isRepeat: boolean;
}) {
  const face = "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-sm [backface-visibility:hidden]";
  return (
    <div className="perspective">
      <button
        type="button"
        onClick={onReveal}
        disabled={revealed}
        aria-label={revealed ? `Answer: ${card.answer}` : `${card.question} ${card.prompt}. Tap to reveal the answer.`}
        data-testid="flashcard"
        data-revealed={revealed}
        className={cn(
          "relative block h-72 w-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default sm:h-80",
          revealed && "[transform:rotateY(180deg)]",
        )}
      >
        <div className={face} aria-hidden={revealed}>
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {card.question}
          </span>
          <span className={PROMPT_STYLE[card.kind]} data-testid="card-prompt">
            {card.prompt}
          </span>
          <span className="text-xs text-muted-foreground">
            {isRepeat ? "Another try · " : ""}Tap or press Space to reveal
          </span>
        </div>
        <div className={cn(face, "[transform:rotateY(180deg)] border-primary/30 bg-accent/40")} aria-hidden={!revealed}>
          <span className="font-mono text-sm font-medium text-muted-foreground">{card.prompt}</span>
          <span className="text-4xl font-semibold sm:text-5xl" data-testid="card-answer">
            {card.answer}
          </span>
          <span className="max-w-sm text-sm text-muted-foreground">{card.answerDetail}</span>
        </div>
      </button>
    </div>
  );
}
