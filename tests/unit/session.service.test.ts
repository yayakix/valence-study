import { describe, expect, it } from "vitest";
import { seededRandom } from "@/domain/shared/random";
import { toCardId } from "@/domain/study/flashcard.service";
import { createInitialProgress } from "@/domain/study/progress.service";
import {
  SESSION_RULES,
  answerCurrentCard,
  buildLearnQueue,
  buildReviewQueue,
  countDueCards,
  createSession,
  currentCardId,
  recordUnlocks,
  revealCurrentCard,
  sessionProgress,
  summarizeSession,
} from "@/domain/study/session.service";
import { DAY_MS } from "@/domain/study/spaced-repetition.service";
import type { CardId, CardKind } from "@/domain/study/types";
import { T0, catalog, progressWithMastered, reviewed } from "../helpers";

const KINDS: CardKind[] = ["symbol-to-name", "name-to-symbol"];
const queueInput = { catalog, kinds: KINDS, now: T0, random: seededRandom(1) };

describe("queue builders", () => {
  it("learn: takes new section cards up to the session size", () => {
    const ids = buildLearnQueue({ ...queueInput, progress: createInitialProgress(T0), size: 12, sectionId: 1 });
    expect(ids).toHaveLength(12);
    expect(ids.every((id) => catalog.sectionOf(Number(id.split(":")[0])).id === 1)).toBe(true);
  });

  it("learn: puts due cards and low streaks ahead of mastered cards", () => {
    const progress = progressWithMastered([1, 2, 3, 4, 5, 6, 7, 8, 9], KINDS);
    const due = toCardId(1, "symbol-to-name");
    progress.cards[due] = { ...progress.cards[due]!, dueAt: T0 - 1 };
    const ids = buildLearnQueue({ ...queueInput, progress, size: 3, sectionId: 1 });
    expect(new Set(ids)).toEqual(new Set([due, toCardId(10, "symbol-to-name"), toCardId(10, "name-to-symbol")]));
  });

  it("learn: offers mastered cards as practice when nothing else is left", () => {
    const progress = progressWithMastered(catalog.sections[0]!.atomicNumbers, KINDS);
    expect(buildLearnQueue({ ...queueInput, progress, size: 5, sectionId: 1 })).toHaveLength(5);
  });

  it("review: only includes due cards from unlocked sections, oldest first", () => {
    const progress = createInitialProgress(T0);
    progress.cards[toCardId(1, "symbol-to-name")] = reviewed(1, "symbol-to-name", ["good"], T0 - 3 * DAY_MS);
    progress.cards[toCardId(2, "symbol-to-name")] = reviewed(2, "symbol-to-name", ["good"], T0);
    progress.cards[toCardId(15, "symbol-to-name")] = reviewed(15, "symbol-to-name", ["good"], T0 - 3 * DAY_MS);
    const ids = buildReviewQueue({ ...queueInput, progress, size: 10 });
    expect(ids).toEqual([toCardId(1, "symbol-to-name")]);
    expect(countDueCards(catalog, progress, KINDS, T0)).toBe(1);
    expect(countDueCards(catalog, { ...progress, unlockedSectionIds: [1, 2] }, KINDS, T0)).toBe(2);
  });
});

describe("session state transitions", () => {
  const queue: CardId[] = ["1:symbol-to-name", "2:symbol-to-name", "3:symbol-to-name"];
  const start = () => createSession({ id: "s1", mode: "learn", sectionId: 1, queue, now: T0 });

  it("refuses to start an empty session", () => {
    expect(() => createSession({ id: "x", mode: "review", sectionId: null, queue: [], now: T0 })).toThrow();
  });

  it("reveals, answers, and advances", () => {
    let session = start();
    expect(currentCardId(session)).toBe(queue[0]);
    session = revealCurrentCard(session);
    expect(session.revealed).toBe(true);
    expect(revealCurrentCard(session)).toBe(session);
    session = answerCurrentCard(session, "good", T0 + 1);
    expect(session).toMatchObject({ position: 1, revealed: false, completedAt: null });
    expect(currentCardId(session)).toBe(queue[1]);
    expect(sessionProgress(session)).toEqual({ completed: 1, total: 3, ratio: 1 / 3 });
  });

  it("requeues missed cards a few cards later, up to a limit", () => {
    let session = createSession({
      id: "s",
      mode: "learn",
      sectionId: 1,
      queue: ["1:symbol-to-name", "2:symbol-to-name", "3:symbol-to-name", "4:symbol-to-name", "5:symbol-to-name"],
      now: T0,
    });
    session = answerCurrentCard(session, "again", T0);
    expect(session.queue.indexOf("1:symbol-to-name", 1)).toBe(1 + SESSION_RULES.requeueGap);
    expect(session.queue).toHaveLength(6);

    let misses = 0;
    while (session.completedAt === null) {
      const id = currentCardId(session)!;
      const rating = id === "1:symbol-to-name" ? "again" : "good";
      if (rating === "again") misses++;
      session = answerCurrentCard(session, rating, T0);
    }
    expect(misses).toBe(SESSION_RULES.maxRequeues);
    expect(session.requeueCounts["1:symbol-to-name"]).toBe(SESSION_RULES.maxRequeues);
  });

  it("completes after the last card and rejects further answers", () => {
    let session = start();
    for (const rating of ["good", "hard", "easy"] as const) session = answerCurrentCard(session, rating, T0 + 5);
    expect(session.completedAt).toBe(T0 + 5);
    expect(currentCardId(session)).toBeNull();
    expect(() => answerCurrentCard(session, "good", T0)).toThrow();
  });

  it("summarizes accuracy, ratings, unique cards, and unlocks", () => {
    let session = start();
    for (const rating of ["again", "good", "good", "good"] as const) session = answerCurrentCard(session, rating, T0 + 1);
    session = recordUnlocks(session, [2]);
    const summary = summarizeSession(session);
    expect(summary).toMatchObject({
      totalAnswers: 4,
      uniqueCards: 3,
      correct: 3,
      accuracy: 0.75,
      ratings: { again: 1, hard: 0, good: 3, easy: 0 },
      unlockedSectionIds: [2],
    });
  });
});
