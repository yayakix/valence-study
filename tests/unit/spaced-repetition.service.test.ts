import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  MINUTE_MS,
  formatInterval,
  isDue,
  previewIntervals,
  scheduleReview,
  SR_CONFIG,
} from "@/domain/study/spaced-repetition.service";
import type { CardReviewState } from "@/domain/study/types";
import { T0, reviewed } from "../helpers";

const ID = "1:symbol-to-name" as const;

describe("scheduleReview", () => {
  it("schedules a new card one day out after a good recall", () => {
    const state = scheduleReview(undefined, ID, "good", T0);
    expect(state).toMatchObject({ repetitions: 1, intervalDays: 1, easeFactor: 2.5, lapses: 0, lastReviewedAt: T0 });
    expect(state.dueAt).toBe(T0 + DAY_MS);
    expect(state.history).toEqual([{ reviewedAt: T0, rating: "good", intervalDays: 1 }]);
  });

  it("grows intervals with consecutive successes", () => {
    const intervals = [1, 2, 3, 4].map((n) => reviewed(1, "symbol-to-name", Array(n).fill("good")).intervalDays);
    expect(intervals).toEqual([1, 6, 15, 38]);
  });

  it("gives easy a longer interval and raises ease; hard shortens and lowers it", () => {
    const easy = scheduleReview(undefined, ID, "easy", T0);
    const hard = scheduleReview(undefined, ID, "hard", T0);
    expect(easy.intervalDays).toBeGreaterThan(hard.intervalDays);
    expect(easy.easeFactor).toBeCloseTo(2.6);
    expect(hard.easeFactor).toBeCloseTo(2.36);
  });

  it("resets the streak and relearns soon after a miss, counting a lapse only for known cards", () => {
    const fresh = scheduleReview(undefined, ID, "again", T0);
    expect(fresh).toMatchObject({ repetitions: 0, intervalDays: 0, lapses: 0 });
    expect(fresh.dueAt).toBe(T0 + SR_CONFIG.relearnDelayMs);

    const known = reviewed(1, "symbol-to-name", ["good", "good"]);
    const lapsed = scheduleReview(known, ID, "again", T0 + 10 * DAY_MS);
    expect(lapsed).toMatchObject({ repetitions: 0, lapses: 1 });
    expect(lapsed.easeFactor).toBeCloseTo(known.easeFactor - 0.2);
    expect(lapsed.history).toHaveLength(3);
  });

  it("never drops ease below the minimum", () => {
    const state = reviewed(1, "symbol-to-name", Array(20).fill("again"));
    expect(state.easeFactor).toBe(SR_CONFIG.minimumEase);
  });

  it("caps history length and interval length", () => {
    const many = reviewed(1, "symbol-to-name", Array(SR_CONFIG.maxHistoryEntries + 20).fill("easy"));
    expect(many.history).toHaveLength(SR_CONFIG.maxHistoryEntries);
    expect(many.intervalDays).toBeLessThanOrEqual(SR_CONFIG.maxIntervalDays);
  });

  it("does not mutate the previous state", () => {
    const before = reviewed(1, "symbol-to-name", ["good"]);
    const snapshot = structuredClone(before);
    scheduleReview(before, ID, "again", T0 + DAY_MS);
    expect(before).toEqual(snapshot);
  });
});

describe("due dates and previews", () => {
  it("treats only reviewed cards past their due date as due", () => {
    const state: CardReviewState = reviewed(1, "symbol-to-name", ["good"]);
    expect(isDue(undefined, T0)).toBe(false);
    expect(isDue(state, T0)).toBe(false);
    expect(isDue(state, state.dueAt)).toBe(true);
  });

  it("previews intervals for every rating", () => {
    const preview = previewIntervals(undefined, ID, T0);
    expect(preview.again).toBe(10 * MINUTE_MS);
    expect(preview.good).toBe(DAY_MS);
    expect(preview.easy).toBe(4 * DAY_MS);
  });

  it("formats intervals compactly", () => {
    expect(formatInterval(10 * MINUTE_MS)).toBe("10m");
    expect(formatInterval(3 * 60 * MINUTE_MS)).toBe("3h");
    expect(formatInterval(6 * DAY_MS)).toBe("6d");
    expect(formatInterval(45 * DAY_MS)).toBe("1.5mo");
    expect(formatInterval(400 * DAY_MS)).toBe("1.1y");
  });
});
