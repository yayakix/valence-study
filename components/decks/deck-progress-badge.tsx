"use client";

import { useDeck } from "@/hooks/useDeck";

export function DeckProgressBadge({ deckId }: { deckId: string }) {
  const { ready, mastery } = useDeck(deckId);
  if (!ready || !mastery) return <span className="text-xs text-muted-foreground">&nbsp;</span>;
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {mastery.mastered === 0 && mastery.learning === 0
        ? "Not started"
        : `${mastery.mastered} of ${mastery.total} cards mastered`}
    </span>
  );
}
