import { cardIdsForSections, toCardId } from "./flashcard.service";
import type {
  CardId,
  CardKind,
  CardReviewState,
  MasteryLevel,
  MasterySummary,
  ProgressRecord,
  Section,
  StudyCatalog,
} from "./types";

export function cardMasteryLevel(state: CardReviewState | undefined, masteryStreak: number): MasteryLevel {
  if (!state || state.history.length === 0) return "new";
  return state.repetitions >= masteryStreak ? "mastered" : "learning";
}

export function summarizeMastery(
  cardIds: readonly CardId[],
  cards: ProgressRecord["cards"],
  masteryStreak: number,
): MasterySummary {
  let mastered = 0;
  let learning = 0;
  let unseen = 0;
  let points = 0;
  for (const id of cardIds) {
    const state = cards[id];
    const level = cardMasteryLevel(state, masteryStreak);
    if (level === "mastered") {
      mastered++;
      points += 1;
    } else if (level === "learning") {
      learning++;
      points += Math.min(state!.repetitions, masteryStreak) / masteryStreak;
    } else {
      unseen++;
    }
  }
  const total = cardIds.length;
  return {
    total,
    mastered,
    learning,
    unseen,
    masteredRatio: total === 0 ? 0 : mastered / total,
    score: total === 0 ? 0 : points / total,
  };
}

export function sectionMastery(
  catalog: StudyCatalog,
  section: Section,
  kinds: readonly CardKind[],
  cards: ProgressRecord["cards"],
): MasterySummary {
  return summarizeMastery(cardIdsForSections(catalog, [section.id], kinds), cards, catalog.config.masteryStreak);
}

export function elementMastery(
  atomicNumber: number,
  kinds: readonly CardKind[],
  cards: ProgressRecord["cards"],
  masteryStreak: number,
): MasterySummary {
  return summarizeMastery(
    kinds.map((kind) => toCardId(atomicNumber, kind)),
    cards,
    masteryStreak,
  );
}

export function isSectionMastered(
  catalog: StudyCatalog,
  section: Section,
  kinds: readonly CardKind[],
  cards: ProgressRecord["cards"],
): boolean {
  const summary = sectionMastery(catalog, section, kinds, cards);
  return summary.total > 0 && summary.masteredRatio >= catalog.config.unlockThreshold;
}
