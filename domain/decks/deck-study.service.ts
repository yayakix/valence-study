import { shuffle, type RandomSource } from "@/domain/shared/random";
import { cardMasteryLevel, summarizeMastery } from "@/domain/study/mastery.service";
import { isDue, scheduleReview } from "@/domain/study/spaced-repetition.service";
import type { MasterySummary, RecallRating } from "@/domain/study/types";
import { deckCardIds, deckSections } from "./deck.service";
import { DECK_RULES, type Deck, type DeckCardId, type DeckProgress, type DeckRange, type DeckSection } from "./types";

export function createInitialDeckProgress(deck: Deck, now: number): DeckProgress {
  return {
    cards: {},
    unlockedSectionIds: [1],
    promptIds: deck.prompts.map((prompt) => prompt.id),
    range: null,
    activeSession: null,
    sessionHistory: [],
    updatedAt: now,
  };
}

/** Drops prompts and sections that no longer exist in the deck, keeping section 1 open. */
export function normalizeDeckProgress(deck: Deck, progress: DeckProgress): DeckProgress {
  const validPrompts = new Set(deck.prompts.map((prompt) => prompt.id));
  const promptIds = progress.promptIds.filter((id) => validPrompts.has(id));
  const sectionCount = deckSections(deck).length;
  const unlocked = [...new Set([1, ...progress.unlockedSectionIds])]
    .filter((id) => id >= 1 && id <= sectionCount)
    .sort((a, b) => a - b);
  return {
    ...progress,
    promptIds: promptIds.length > 0 ? promptIds : deck.prompts.map((prompt) => prompt.id),
    unlockedSectionIds: unlocked,
    range: normalizeDeckRange(deck, progress.range),
  };
}

/** Orders and clamps a range to the deck; a range covering everything becomes null. */
export function normalizeDeckRange(deck: Deck, range: DeckRange | null): DeckRange | null {
  if (!range) return null;
  const last = deck.items.length - 1;
  const clamp = (n: number) => Math.min(last, Math.max(0, Math.round(n)));
  const start = clamp(Math.min(range.start, range.end));
  const end = clamp(Math.max(range.start, range.end));
  return start === 0 && end === last ? null : { start, end };
}

export function rangeItemIds(deck: Deck, range: DeckRange | null): string[] {
  const items = range ? deck.items.slice(range.start, range.end + 1) : deck.items;
  return items.map((item) => item.id);
}

export function rangeLabel(deck: Deck, range: DeckRange | null): string {
  const label = (index: number) => deck.items[index]?.fields[deck.sectionLabelField] ?? "";
  if (!range) return `All ${deck.items.length} ${deck.itemNoun}`;
  if (range.start === range.end) return label(range.start);
  return `${label(range.start)}–${label(range.end)}`;
}

/** The range matching a section, for one-tap presets. */
export function sectionRange(deck: Deck, section: DeckSection): DeckRange {
  const start = deck.items.findIndex((item) => item.id === section.itemIds[0]);
  return { start, end: start + section.itemIds.length - 1 };
}

export function applyDeckReview(
  progress: DeckProgress,
  cardId: DeckCardId,
  rating: RecallRating,
  now: number,
): DeckProgress {
  return {
    ...progress,
    cards: { ...progress.cards, [cardId]: scheduleReview(progress.cards[cardId], cardId, rating, now) },
    updatedAt: now,
  };
}

export function deckItemsMastery(
  progress: Pick<DeckProgress, "cards" | "promptIds">,
  itemIds: readonly string[],
): MasterySummary {
  return summarizeMastery(deckCardIds(itemIds, progress.promptIds), progress.cards, DECK_RULES.masteryStreak);
}

export function deckMastery(deck: Deck, progress: Pick<DeckProgress, "cards" | "promptIds">): MasterySummary {
  return deckItemsMastery(
    progress,
    deck.items.map((item) => item.id),
  );
}

/** Unlocks following sections while the highest unlocked one meets the mastery threshold. */
export function resolveDeckUnlocks(
  deck: Deck,
  progress: Pick<DeckProgress, "cards" | "promptIds" | "unlockedSectionIds">,
): { unlockedSectionIds: number[]; newlyUnlocked: number[] } {
  const sections = deckSections(deck);
  const unlocked = [...progress.unlockedSectionIds];
  const newlyUnlocked: number[] = [];
  for (;;) {
    const frontier = sections.find((section) => section.id === Math.max(...unlocked));
    const next = frontier && sections.find((section) => section.id === frontier.id + 1);
    if (!frontier || !next) break;
    const mastery = deckItemsMastery(progress, frontier.itemIds);
    if (mastery.total === 0 || mastery.masteredRatio < DECK_RULES.unlockThreshold) break;
    unlocked.push(next.id);
    newlyUnlocked.push(next.id);
  }
  return { unlockedSectionIds: unlocked, newlyUnlocked };
}

interface DeckQueueInput {
  progress: Pick<DeckProgress, "cards" | "promptIds">;
  size: number;
  now: number;
  random: RandomSource;
}

/** Due cards first, then the weakest unmastered cards, then mastered ones as practice. */
export function buildDeckQueue(input: DeckQueueInput & { itemIds: readonly string[] }): DeckCardId[] {
  const { progress, size, now, random, itemIds } = input;
  const ranked = deckCardIds(itemIds, progress.promptIds).map((id, order) => {
    const state = progress.cards[id];
    return {
      id,
      order,
      due: isDue(state, now),
      mastered: cardMasteryLevel(state, DECK_RULES.masteryStreak) === "mastered",
      repetitions: state?.repetitions ?? 0,
      dueAt: state?.dueAt ?? Infinity,
    };
  });
  const active = ranked
    .filter((card) => card.due || !card.mastered)
    .sort((a, b) => Number(b.due) - Number(a.due) || a.repetitions - b.repetitions || a.order - b.order);
  const practice = ranked
    .filter((card) => !card.due && card.mastered)
    .sort((a, b) => a.dueAt - b.dueAt || a.order - b.order);
  return shuffle(
    [...active, ...practice].slice(0, size).map((card) => card.id),
    random,
  );
}

export function unlockedItemIds(deck: Deck, unlockedSectionIds: readonly number[]): string[] {
  return deckSections(deck)
    .filter((section) => unlockedSectionIds.includes(section.id))
    .flatMap((section) => section.itemIds);
}

/** Cards from unlocked sections whose review date has passed, soonest first. */
export function buildDeckReviewQueue(
  deck: Deck,
  input: DeckQueueInput & { unlockedSectionIds: readonly number[] },
): DeckCardId[] {
  const { progress, size, now, random } = input;
  const due = deckCardIds(unlockedItemIds(deck, input.unlockedSectionIds), progress.promptIds)
    .filter((id) => isDue(progress.cards[id], now))
    .sort((a, b) => progress.cards[a]!.dueAt - progress.cards[b]!.dueAt)
    .slice(0, size);
  return shuffle(due, random);
}

export function countDeckDue(deck: Deck, progress: DeckProgress, now: number): number {
  return deckCardIds(unlockedItemIds(deck, progress.unlockedSectionIds), progress.promptIds).filter((id) =>
    isDue(progress.cards[id], now),
  ).length;
}

export function findSection(deck: Deck, sectionId: number): DeckSection | undefined {
  return deckSections(deck).find((section) => section.id === sectionId);
}
