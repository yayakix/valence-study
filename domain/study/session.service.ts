import { shuffle, type RandomSource } from "@/domain/shared/random";
import { reviewPriority } from "./cumulative-review.service";
import { cardIdsForSections } from "./flashcard.service";
import { cardMasteryLevel } from "./mastery.service";
import { isDue } from "./spaced-repetition.service";
import { countRatings, accuracyOf } from "./stats.service";
import type {
  CardId,
  CardKind,
  ProgressRecord,
  RecallRating,
  SessionMode,
  SessionSummary,
  StudyCatalog,
  StudySession,
} from "./types";

export const SESSION_RULES = {
  /** How many cards later a missed card reappears in the same session. */
  requeueGap: 3,
  /** Maximum extra appearances of a missed card within one session. */
  maxRequeues: 2,
} as const;

interface QueueInput {
  catalog: StudyCatalog;
  progress: Pick<ProgressRecord, "cards" | "unlockedSectionIds">;
  kinds: readonly CardKind[];
  size: number;
  now: number;
  random: RandomSource;
}

/**
 * Focused study of one section: due cards first, then the lowest recall
 * streaks (new cards included), then already-mastered cards as practice.
 */
export function buildLearnQueue(input: QueueInput & { sectionId: number }): CardId[] {
  const { catalog, progress, kinds, size, now, random, sectionId } = input;
  const streak = catalog.config.masteryStreak;
  const ranked = cardIdsForSections(catalog, [sectionId], kinds).map((id, order) => {
    const state = progress.cards[id];
    const mastered = cardMasteryLevel(state, streak) === "mastered";
    return {
      id,
      order,
      due: isDue(state, now),
      mastered,
      repetitions: state?.repetitions ?? 0,
      priority: reviewPriority(state, now, streak),
    };
  });
  const active = ranked
    .filter((card) => card.due || !card.mastered)
    .sort(
      (a, b) =>
        Number(b.due) - Number(a.due) || a.repetitions - b.repetitions || a.order - b.order,
    );
  const practice = ranked
    .filter((card) => !card.due && card.mastered)
    .sort((a, b) => b.priority - a.priority || a.order - b.order);
  return shuffle(
    [...active, ...practice].slice(0, size).map((card) => card.id),
    random,
  );
}

/** Spaced-repetition reviews: cards from unlocked sections whose due date has passed. */
export function buildReviewQueue(input: QueueInput): CardId[] {
  const { catalog, progress, kinds, size, now, random } = input;
  const due = cardIdsForSections(catalog, progress.unlockedSectionIds, kinds)
    .filter((id) => isDue(progress.cards[id], now))
    .sort((a, b) => progress.cards[a]!.dueAt - progress.cards[b]!.dueAt)
    .slice(0, size);
  return shuffle(due, random);
}

export function countDueCards(
  catalog: StudyCatalog,
  progress: Pick<ProgressRecord, "cards" | "unlockedSectionIds">,
  kinds: readonly CardKind[],
  now: number,
): number {
  return cardIdsForSections(catalog, progress.unlockedSectionIds, kinds).filter((id) =>
    isDue(progress.cards[id], now),
  ).length;
}

export function createSession(params: {
  id: string;
  mode: SessionMode;
  sectionId: number | null;
  queue: readonly CardId[];
  now: number;
}): StudySession {
  if (params.queue.length === 0) throw new Error("Cannot start a session with no cards");
  return {
    id: params.id,
    mode: params.mode,
    sectionId: params.sectionId,
    queue: [...params.queue],
    position: 0,
    revealed: false,
    answers: [],
    requeueCounts: {},
    unlockedDuringSession: [],
    startedAt: params.now,
    completedAt: null,
  };
}

export function currentCardId(session: StudySession): CardId | null {
  if (session.completedAt !== null) return null;
  return session.queue[session.position] ?? null;
}

export function revealCurrentCard(session: StudySession): StudySession {
  if (session.completedAt !== null || session.revealed) return session;
  return { ...session, revealed: true };
}

export function answerCurrentCard(session: StudySession, rating: RecallRating, now: number): StudySession {
  const cardId = currentCardId(session);
  if (!cardId) throw new Error("Session has no current card");

  const queue = [...session.queue];
  const requeueCounts = { ...session.requeueCounts };
  const timesRequeued = requeueCounts[cardId] ?? 0;
  if (rating === "again" && timesRequeued < SESSION_RULES.maxRequeues) {
    const insertAt = Math.min(session.position + 1 + SESSION_RULES.requeueGap, queue.length);
    queue.splice(insertAt, 0, cardId);
    requeueCounts[cardId] = timesRequeued + 1;
  }

  const position = session.position + 1;
  return {
    ...session,
    queue,
    requeueCounts,
    position,
    revealed: false,
    answers: [...session.answers, { cardId, rating, answeredAt: now }],
    completedAt: position >= queue.length ? now : null,
  };
}

export function sessionProgress(session: StudySession): { completed: number; total: number; ratio: number } {
  const total = session.queue.length;
  const completed = Math.min(session.position, total);
  return { completed, total, ratio: total === 0 ? 1 : completed / total };
}

export function recordUnlocks(session: StudySession, sectionIds: readonly number[]): StudySession {
  if (sectionIds.length === 0) return session;
  return { ...session, unlockedDuringSession: [...new Set([...session.unlockedDuringSession, ...sectionIds])] };
}

export function summarizeSession(session: StudySession): SessionSummary {
  const ratings = countRatings(session.answers.map((answer) => answer.rating));
  const totalAnswers = session.answers.length;
  return {
    id: session.id,
    mode: session.mode,
    sectionId: session.sectionId,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? session.answers.at(-1)?.answeredAt ?? session.startedAt,
    totalAnswers,
    uniqueCards: new Set(session.answers.map((answer) => answer.cardId)).size,
    correct: totalAnswers - ratings.again,
    accuracy: accuracyOf(ratings),
    ratings,
    unlockedSectionIds: [...session.unlockedDuringSession],
  };
}
