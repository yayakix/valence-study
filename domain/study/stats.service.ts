import { cardIdsForSections } from "./flashcard.service";
import { summarizeMastery } from "./mastery.service";
import { isDue, isSuccessfulRecall } from "./spaced-repetition.service";
import type { CardKind, ProgressRecord, RatingCounts, RecallRating, StudyCatalog } from "./types";

export function countRatings(ratings: readonly RecallRating[]): RatingCounts {
  const counts: RatingCounts = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const rating of ratings) counts[rating]++;
  return counts;
}

/** Share of answers that were recalled (anything but "again"), 0–1. */
export function accuracyOf(counts: RatingCounts): number {
  const total = counts.again + counts.hard + counts.good + counts.easy;
  return total === 0 ? 0 : (total - counts.again) / total;
}

function localDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Consecutive local calendar days with at least one review, ending today or yesterday. */
export function studyDayStreak(reviewTimestamps: readonly number[], now: number): number {
  const days = new Set(reviewTimestamps.map(localDayKey));
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if (!days.has(localDayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface StudyStats {
  totalReviews: number;
  accuracy: number;
  ratings: RatingCounts;
  cardsStudied: number;
  masteredCards: number;
  learningCards: number;
  totalCards: number;
  dueNow: number;
  sessionsCompleted: number;
  dayStreak: number;
}

export function computeStudyStats(
  catalog: StudyCatalog,
  progress: ProgressRecord,
  kinds: readonly CardKind[],
  now: number,
): StudyStats {
  const states = Object.values(progress.cards).filter((state) => state !== undefined);
  const history = states.flatMap((state) => state.history);
  const ratings = countRatings(history.map((entry) => entry.rating));
  const allIds = cardIdsForSections(
    catalog,
    catalog.sections.map((section) => section.id),
    kinds,
  );
  const mastery = summarizeMastery(allIds, progress.cards, catalog.config.masteryStreak);
  const unlockedIds = cardIdsForSections(catalog, progress.unlockedSectionIds, kinds);
  return {
    totalReviews: history.length,
    accuracy: accuracyOf(ratings),
    ratings,
    cardsStudied: mastery.mastered + mastery.learning,
    masteredCards: mastery.mastered,
    learningCards: mastery.learning,
    totalCards: mastery.total,
    dueNow: unlockedIds.filter((id) => isDue(progress.cards[id], now)).length,
    sessionsCompleted: progress.sessionHistory.length,
    dayStreak: studyDayStreak(
      history.map((entry) => entry.reviewedAt),
      now,
    ),
  };
}

export function recentAccuracy(progress: ProgressRecord, lastN: number): number | null {
  const history = Object.values(progress.cards)
    .flatMap((state) => state?.history ?? [])
    .sort((a, b) => b.reviewedAt - a.reviewedAt)
    .slice(0, lastN);
  if (history.length === 0) return null;
  return history.filter((entry) => isSuccessfulRecall(entry.rating)).length / history.length;
}
