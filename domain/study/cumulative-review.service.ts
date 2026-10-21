import { shuffle, type RandomSource } from "@/domain/shared/random";
import { cardIdsForSections } from "./flashcard.service";
import { DAY_MS } from "./spaced-repetition.service";
import type { CardId, CardKind, CardReviewState, ProgressRecord, StudyCatalog } from "./types";

/**
 * Higher means the card needs attention sooner. Unseen cards score -1 so that
 * cumulative reviews favor material the learner has already met.
 */
export function reviewPriority(state: CardReviewState | undefined, now: number, masteryStreak: number): number {
  if (!state || state.history.length === 0) return -1;
  const streakGap = 1 - Math.min(state.repetitions, masteryStreak) / masteryStreak;
  const overdueDays = Math.max(0, (now - state.dueAt) / DAY_MS);
  const overdueRatio = Math.min(3, overdueDays / Math.max(1, state.intervalDays));
  return streakGap * 2 + state.lapses * 0.5 + overdueRatio + (2.5 - state.easeFactor);
}

export interface CumulativeReviewInput {
  catalog: StudyCatalog;
  progress: Pick<ProgressRecord, "cards" | "unlockedSectionIds">;
  kinds: readonly CardKind[];
  size: number;
  now: number;
  random: RandomSource;
}

/**
 * Draws cards round-robin from every unlocked section so earlier material keeps
 * coming back, taking each section's weakest cards first.
 */
export function buildCumulativeReview({ catalog, progress, kinds, size, now, random }: CumulativeReviewInput): CardId[] {
  const streak = catalog.config.masteryStreak;
  const pools = catalog.sections
    .filter((section) => progress.unlockedSectionIds.includes(section.id))
    .map((section) =>
      cardIdsForSections(catalog, [section.id], kinds)
        .map((id, order) => ({ id, order, priority: reviewPriority(progress.cards[id], now, streak) }))
        .sort((a, b) => b.priority - a.priority || a.order - b.order)
        .map((entry) => entry.id),
    )
    .filter((pool) => pool.length > 0);

  const picked: CardId[] = [];
  let depth = 0;
  while (picked.length < size && pools.some((pool) => depth < pool.length)) {
    for (const pool of pools) {
      const id = pool[depth];
      if (id && picked.length < size) picked.push(id);
    }
    depth++;
  }
  return shuffle(picked, random);
}
