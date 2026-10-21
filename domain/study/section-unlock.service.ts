import { isSectionMastered } from "./mastery.service";
import type { CardKind, ProgressRecord, Section, StudyCatalog } from "./types";

export const INITIAL_UNLOCKED_SECTIONS: readonly number[] = [1];

export function normalizeUnlockedSections(catalog: StudyCatalog, ids: readonly number[]): number[] {
  const valid = new Set(catalog.sections.map((section) => section.id));
  const unique = new Set([...INITIAL_UNLOCKED_SECTIONS, ...ids.filter((id) => valid.has(id))]);
  return [...unique].sort((a, b) => a - b);
}

export function isSectionUnlocked(progress: Pick<ProgressRecord, "unlockedSectionIds">, sectionId: number): boolean {
  return progress.unlockedSectionIds.includes(sectionId);
}

export function highestUnlockedSection(catalog: StudyCatalog, unlockedIds: readonly number[]): Section {
  const ids = normalizeUnlockedSections(catalog, unlockedIds);
  const highest = ids[ids.length - 1]!;
  return catalog.sections.find((section) => section.id === highest)!;
}

/** The section that would unlock next if the frontier section were mastered, or null at the end. */
export function nextLockedSection(catalog: StudyCatalog, unlockedIds: readonly number[]): Section | null {
  const frontier = highestUnlockedSection(catalog, unlockedIds);
  return catalog.sections.find((section) => section.id === frontier.id + 1) ?? null;
}

/**
 * Returns the section that should unlock now, if the frontier section meets
 * the mastery threshold; null otherwise.
 */
export function determineNextUnlock(
  catalog: StudyCatalog,
  progress: Pick<ProgressRecord, "unlockedSectionIds" | "cards">,
  kinds: readonly CardKind[],
): Section | null {
  const frontier = highestUnlockedSection(catalog, progress.unlockedSectionIds);
  const next = nextLockedSection(catalog, progress.unlockedSectionIds);
  if (!next) return null;
  return isSectionMastered(catalog, frontier, kinds, progress.cards) ? next : null;
}

/** Unlocks as many sections as the current mastery allows, one frontier at a time. */
export function resolveUnlocks(
  catalog: StudyCatalog,
  progress: Pick<ProgressRecord, "unlockedSectionIds" | "cards">,
  kinds: readonly CardKind[],
): { unlockedSectionIds: number[]; newlyUnlocked: number[] } {
  let unlocked = normalizeUnlockedSections(catalog, progress.unlockedSectionIds);
  const newlyUnlocked: number[] = [];
  for (;;) {
    const next = determineNextUnlock(catalog, { unlockedSectionIds: unlocked, cards: progress.cards }, kinds);
    if (!next) break;
    unlocked = [...unlocked, next.id];
    newlyUnlocked.push(next.id);
  }
  return { unlockedSectionIds: unlocked, newlyUnlocked };
}
