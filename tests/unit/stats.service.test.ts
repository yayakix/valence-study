import { describe, expect, it } from "vitest";
import { createInitialProgress } from "@/domain/study/progress.service";
import { accuracyOf, computeStudyStats, countRatings, recentAccuracy, studyDayStreak } from "@/domain/study/stats.service";
import { toCardId } from "@/domain/study/flashcard.service";
import { T0, catalog, reviewed } from "../helpers";

const day = (offset: number, hour = 10) => {
  const d = new Date(T0);
  d.setDate(d.getDate() + offset);
  d.setHours(hour);
  return d.getTime();
};

describe("stats", () => {
  it("counts ratings and computes accuracy", () => {
    const counts = countRatings(["again", "good", "good", "easy"]);
    expect(counts).toEqual({ again: 1, hard: 0, good: 2, easy: 1 });
    expect(accuracyOf(counts)).toBe(0.75);
    expect(accuracyOf(countRatings([]))).toBe(0);
  });

  it("computes the day streak ending today or yesterday", () => {
    expect(studyDayStreak([], T0)).toBe(0);
    expect(studyDayStreak([day(0), day(-1), day(-2), day(-4)], day(0, 20))).toBe(3);
    expect(studyDayStreak([day(-1), day(-2)], day(0))).toBe(2);
    expect(studyDayStreak([day(-3)], day(0))).toBe(0);
  });

  it("aggregates progress into study stats", () => {
    const progress = createInitialProgress(T0);
    progress.cards[toCardId(1, "symbol-to-name")] = reviewed(1, "symbol-to-name", ["good", "good", "good"]);
    progress.cards[toCardId(2, "symbol-to-name")] = reviewed(2, "symbol-to-name", ["again", "good"]);
    const stats = computeStudyStats(catalog, progress, ["symbol-to-name"], T0 + 2 * 86_400_000);
    expect(stats).toMatchObject({
      totalReviews: 5,
      accuracy: 0.8,
      cardsStudied: 2,
      masteredCards: 1,
      learningCards: 1,
      totalCards: 118,
      dueNow: 1,
      sessionsCompleted: 0,
    });
    expect(recentAccuracy(progress, 2)).toBeTypeOf("number");
    expect(recentAccuracy(createInitialProgress(T0), 10)).toBeNull();
  });
});
