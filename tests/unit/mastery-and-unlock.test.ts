import { describe, expect, it } from "vitest";
import { toCardId } from "@/domain/study/flashcard.service";
import { cardMasteryLevel, isSectionMastered, sectionMastery, summarizeMastery } from "@/domain/study/mastery.service";
import { createInitialProgress } from "@/domain/study/progress.service";
import {
  determineNextUnlock,
  highestUnlockedSection,
  nextLockedSection,
  normalizeUnlockedSections,
  resolveUnlocks,
} from "@/domain/study/section-unlock.service";
import type { CardKind } from "@/domain/study/types";
import { T0, catalog, progressWithMastered, reviewed } from "../helpers";

const KINDS: CardKind[] = ["symbol-to-name", "name-to-symbol"];
const section1 = catalog.sections[0]!;

describe("mastery", () => {
  it("requires three consecutive successful recalls", () => {
    expect(cardMasteryLevel(undefined, 3)).toBe("new");
    expect(cardMasteryLevel(reviewed(1, "symbol-to-name", ["good", "good"]), 3)).toBe("learning");
    expect(cardMasteryLevel(reviewed(1, "symbol-to-name", ["good", "hard", "easy"]), 3)).toBe("mastered");
    expect(cardMasteryLevel(reviewed(1, "symbol-to-name", ["good", "good", "good", "again"]), 3)).toBe("learning");
  });

  it("summarizes counts, ratio, and partial-credit score", () => {
    const cards = {
      [toCardId(1, "symbol-to-name")]: reviewed(1, "symbol-to-name", ["good", "good", "good"]),
      [toCardId(2, "symbol-to-name")]: reviewed(2, "symbol-to-name", ["good"]),
    };
    const ids = [toCardId(1, "symbol-to-name"), toCardId(2, "symbol-to-name"), toCardId(3, "symbol-to-name")];
    const summary = summarizeMastery(ids, cards, 3);
    expect(summary).toMatchObject({ total: 3, mastered: 1, learning: 1, unseen: 1 });
    expect(summary.masteredRatio).toBeCloseTo(1 / 3);
    expect(summary.score).toBeCloseTo((1 + 1 / 3) / 3);
  });

  it("only counts enabled card kinds toward a section", () => {
    const progress = progressWithMastered(section1.atomicNumbers, ["symbol-to-name"]);
    expect(sectionMastery(catalog, section1, ["symbol-to-name"], progress.cards).masteredRatio).toBe(1);
    expect(sectionMastery(catalog, section1, KINDS, progress.cards).masteredRatio).toBe(0.5);
  });

  it("treats a section as mastered at the 80% threshold", () => {
    const eight = progressWithMastered(section1.atomicNumbers.slice(0, 8), KINDS);
    const seven = progressWithMastered(section1.atomicNumbers.slice(0, 7), KINDS);
    expect(isSectionMastered(catalog, section1, KINDS, eight.cards)).toBe(true);
    expect(isSectionMastered(catalog, section1, KINDS, seven.cards)).toBe(false);
  });
});

describe("section unlocking", () => {
  it("starts with section 1 unlocked and normalizes stored ids", () => {
    expect(createInitialProgress(T0).unlockedSectionIds).toEqual([1]);
    expect(normalizeUnlockedSections(catalog, [3, 2, 2, 99, -1])).toEqual([1, 2, 3]);
  });

  it("finds the frontier and the next locked section", () => {
    expect(highestUnlockedSection(catalog, [1, 2]).id).toBe(2);
    expect(nextLockedSection(catalog, [1, 2])?.id).toBe(3);
    expect(nextLockedSection(catalog, catalog.sections.map((s) => s.id))).toBeNull();
  });

  it("unlocks the next section only once the frontier is mastered", () => {
    const fresh = createInitialProgress(T0);
    expect(determineNextUnlock(catalog, fresh, KINDS)).toBeNull();
    const mastered = progressWithMastered(section1.atomicNumbers, KINDS);
    expect(determineNextUnlock(catalog, mastered, KINDS)?.id).toBe(2);
  });

  it("judges the frontier, not earlier sections", () => {
    const progress = { ...progressWithMastered(section1.atomicNumbers, KINDS), unlockedSectionIds: [1, 2] };
    expect(determineNextUnlock(catalog, progress, KINDS)).toBeNull();
  });

  it("cascades through several mastered sections and stops at the end of the table", () => {
    const first30 = catalog.sections.slice(0, 3).flatMap((s) => s.atomicNumbers);
    const result = resolveUnlocks(catalog, progressWithMastered(first30, KINDS), KINDS);
    expect(result.newlyUnlocked).toEqual([2, 3, 4]);
    expect(result.unlockedSectionIds).toEqual([1, 2, 3, 4]);

    const all = resolveUnlocks(catalog, progressWithMastered(catalog.elements.map((e) => e.atomicNumber), KINDS), KINDS);
    expect(all.unlockedSectionIds).toHaveLength(12);
  });
});
