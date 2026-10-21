import type { CardId, CardReviewState, RecallRating } from "./types";

export const MINUTE_MS = 60_000;
export const DAY_MS = 86_400_000;

export const SR_CONFIG = {
  initialEase: 2.5,
  minimumEase: 1.3,
  relearnDelayMs: 10 * MINUTE_MS,
  maxIntervalDays: 365,
  maxHistoryEntries: 200,
} as const;

/** SM-2 quality score for each successful rating. */
const QUALITY: Record<Exclude<RecallRating, "again">, number> = { hard: 3, good: 4, easy: 5 };
const FIRST_INTERVAL: Record<Exclude<RecallRating, "again">, number> = { hard: 1, good: 1, easy: 4 };
const SECOND_INTERVAL: Record<Exclude<RecallRating, "again">, number> = { hard: 3, good: 6, easy: 8 };
const INTERVAL_MULTIPLIER: Record<Exclude<RecallRating, "again">, number> = { hard: 0.8, good: 1, easy: 1.3 };

export function isSuccessfulRecall(rating: RecallRating): boolean {
  return rating !== "again";
}

export function createInitialCardState(cardId: CardId, now: number): CardReviewState {
  return {
    cardId,
    easeFactor: SR_CONFIG.initialEase,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: now,
    lastReviewedAt: null,
    history: [],
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Applies a recall rating using a lightly tuned SM-2 schedule. Pure: returns a new state. */
export function scheduleReview(
  previous: CardReviewState | undefined,
  cardId: CardId,
  rating: RecallRating,
  now: number,
): CardReviewState {
  const prev = previous ?? createInitialCardState(cardId, now);

  let next: Omit<CardReviewState, "history">;
  if (rating === "again") {
    next = {
      cardId,
      easeFactor: round2(Math.max(SR_CONFIG.minimumEase, prev.easeFactor - 0.2)),
      intervalDays: 0,
      repetitions: 0,
      lapses: prev.repetitions > 0 ? prev.lapses + 1 : prev.lapses,
      dueAt: now + SR_CONFIG.relearnDelayMs,
      lastReviewedAt: now,
    };
  } else {
    const q = QUALITY[rating];
    const easeFactor = round2(
      Math.max(SR_CONFIG.minimumEase, prev.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))),
    );
    const repetitions = prev.repetitions + 1;
    let intervalDays: number;
    if (repetitions === 1) intervalDays = FIRST_INTERVAL[rating];
    else if (repetitions === 2) intervalDays = SECOND_INTERVAL[rating];
    else
      intervalDays = Math.max(
        prev.intervalDays + 1,
        Math.round(prev.intervalDays * easeFactor * INTERVAL_MULTIPLIER[rating]),
      );
    intervalDays = Math.min(intervalDays, SR_CONFIG.maxIntervalDays);
    next = {
      cardId,
      easeFactor,
      intervalDays,
      repetitions,
      lapses: prev.lapses,
      dueAt: now + intervalDays * DAY_MS,
      lastReviewedAt: now,
    };
  }

  const history = [...prev.history, { reviewedAt: now, rating, intervalDays: next.intervalDays }].slice(
    -SR_CONFIG.maxHistoryEntries,
  );
  return { ...next, history };
}

export function isDue(state: CardReviewState | undefined, now: number): boolean {
  return state !== undefined && state.lastReviewedAt !== null && state.dueAt <= now;
}

/** Time until the card would next be due for each possible rating. */
export function previewIntervals(
  state: CardReviewState | undefined,
  cardId: CardId,
  now: number,
): Record<RecallRating, number> {
  const preview = (rating: RecallRating) => scheduleReview(state, cardId, rating, now).dueAt - now;
  return { again: preview("again"), hard: preview("hard"), good: preview("good"), easy: preview("easy") };
}

export function formatInterval(ms: number): string {
  if (ms < 60 * MINUTE_MS) return `${Math.max(1, Math.round(ms / MINUTE_MS))}m`;
  if (ms < DAY_MS) return `${Math.round(ms / (60 * MINUTE_MS))}h`;
  const days = ms / DAY_MS;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round((days / 30) * 10) / 10}mo`;
  return `${Math.round((days / 365) * 10) / 10}y`;
}
