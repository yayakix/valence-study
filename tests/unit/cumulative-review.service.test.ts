import { describe, expect, it } from "vitest";
import { seededRandom } from "@/domain/shared/random";
import { buildCumulativeReview, reviewPriority } from "@/domain/study/cumulative-review.service";
import { toCardId } from "@/domain/study/flashcard.service";
import { createInitialProgress } from "@/domain/study/progress.service";
import { DAY_MS } from "@/domain/study/spaced-repetition.service";
import type { CardKind, ProgressRecord } from "@/domain/study/types";
import { T0, catalog, progressWithMastered, reviewed } from "../helpers";

const KINDS: CardKind[] = ["symbol-to-name"];

function studiedProgress(sectionIds: number[]): ProgressRecord {
  const numbers = catalog.sections.filter((s) => sectionIds.includes(s.id)).flatMap((s) => s.atomicNumbers);
  return { ...progressWithMastered(numbers, KINDS), unlockedSectionIds: sectionIds };
}

const sectionOfCard = (id: string) => catalog.sectionOf(Number(id.split(":")[0])).id;

describe("reviewPriority", () => {
  it("ranks unseen cards lowest and struggling cards highest", () => {
    const solid = reviewed(1, "symbol-to-name", ["good", "good", "good"]);
    const shaky = reviewed(2, "symbol-to-name", ["good", "good", "again", "hard"]);
    expect(reviewPriority(undefined, T0, 3)).toBe(-1);
    expect(reviewPriority(shaky, T0, 3)).toBeGreaterThan(reviewPriority(solid, T0, 3));
  });

  it("raises priority for overdue cards", () => {
    const state = reviewed(1, "symbol-to-name", ["good", "good", "good"]);
    expect(reviewPriority(state, state.dueAt + 30 * DAY_MS, 3)).toBeGreaterThan(reviewPriority(state, T0, 3));
  });
});

describe("buildCumulativeReview", () => {
  const input = (progress: ProgressRecord, size: number) => ({
    catalog,
    progress,
    kinds: KINDS,
    size,
    now: T0,
    random: seededRandom(7),
  });

  it("draws evenly from every unlocked section and nothing from locked ones", () => {
    const ids = buildCumulativeReview(input(studiedProgress([1, 2, 3]), 12));
    expect(ids).toHaveLength(12);
    const perSection = ids.reduce<Record<number, number>>((acc, id) => {
      const s = sectionOfCard(id);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});
    expect(perSection).toEqual({ 1: 4, 2: 4, 3: 4 });
  });

  it("returns unique cards and stops when the pool is exhausted", () => {
    const ids = buildCumulativeReview(input(studiedProgress([1]), 50));
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
  });

  it("prefers the weakest cards within each section", () => {
    const progress = studiedProgress([1]);
    const weak = toCardId(7, "symbol-to-name");
    progress.cards[weak] = reviewed(7, "symbol-to-name", ["good", "again", "again"]);
    expect(buildCumulativeReview(input(progress, 1))).toEqual([weak]);
  });

  it("is deterministic for a given random source", () => {
    const progress = studiedProgress([1, 2]);
    expect(buildCumulativeReview(input(progress, 8))).toEqual(buildCumulativeReview(input(progress, 8)));
  });

  it("falls back to unseen cards for a brand new learner", () => {
    expect(buildCumulativeReview(input(createInitialProgress(T0), 5))).toHaveLength(5);
  });
});
