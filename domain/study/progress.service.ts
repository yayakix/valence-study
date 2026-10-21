import { getFlashcard } from "./flashcard.service";
import { INITIAL_UNLOCKED_SECTIONS, normalizeUnlockedSections } from "./section-unlock.service";
import { scheduleReview } from "./spaced-repetition.service";
import type { CardId, ProgressRecord, RecallRating, StudyCatalog } from "./types";

export const MAX_SESSION_HISTORY = 100;

export function createInitialProgress(now: number): ProgressRecord {
  return {
    cards: {},
    unlockedSectionIds: [...INITIAL_UNLOCKED_SECTIONS],
    activeSession: null,
    sessionHistory: [],
    updatedAt: now,
  };
}

export function applyReview(progress: ProgressRecord, cardId: CardId, rating: RecallRating, now: number): ProgressRecord {
  return {
    ...progress,
    cards: { ...progress.cards, [cardId]: scheduleReview(progress.cards[cardId], cardId, rating, now) },
    updatedAt: now,
  };
}

/**
 * Drops anything the current curriculum doesn't recognize (e.g. after a
 * dataset change) so a valid-but-stale record can't break the engine.
 */
export function normalizeProgress(progress: ProgressRecord, catalog: StudyCatalog): ProgressRecord {
  const cards: ProgressRecord["cards"] = {};
  for (const [id, state] of Object.entries(progress.cards)) {
    if (state && state.cardId === id && getFlashcard(catalog, state.cardId)) cards[state.cardId] = state;
  }
  const session = progress.activeSession;
  const sessionValid =
    session !== null &&
    session.completedAt === null &&
    session.position < session.queue.length &&
    session.queue.every((id) => getFlashcard(catalog, id) !== null);
  return {
    ...progress,
    cards,
    unlockedSectionIds: normalizeUnlockedSections(catalog, progress.unlockedSectionIds),
    activeSession: sessionValid ? session : null,
    sessionHistory: progress.sessionHistory.slice(-MAX_SESSION_HISTORY),
  };
}
