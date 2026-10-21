import type { ChemicalElement } from "@/domain/elements/types";
import type { Section, StudyCatalog } from "./types";

export function groupIntoSections(
  elements: readonly ChemicalElement[],
  size: number,
  subtitles: Readonly<Record<number, string>> = {},
): Section[] {
  if (!Number.isInteger(size) || size < 1) throw new Error("Section size must be a positive integer");
  const ordered = [...elements].sort((a, b) => a.atomicNumber - b.atomicNumber);
  const sections: Section[] = [];
  for (let start = 0; start < ordered.length; start += size) {
    const members = ordered.slice(start, start + size);
    const from = members[0]!;
    const to = members[members.length - 1]!;
    const id = sections.length + 1;
    sections.push({
      id,
      title: `${from.name} to ${to.name}`,
      subtitle: subtitles[id] ?? `Elements ${from.atomicNumber}–${to.atomicNumber}`,
      atomicNumbers: members.map((element) => element.atomicNumber),
      from,
      to,
    });
  }
  return sections;
}

export function createStudyCatalog(
  elements: readonly ChemicalElement[],
  config: {
    size: number;
    masteryStreak: number;
    unlockThreshold: number;
    subtitles?: Readonly<Record<number, string>>;
  },
): StudyCatalog {
  const sections = groupIntoSections(elements, config.size, config.subtitles);
  const sectionByNumber = new Map<number, Section>();
  for (const section of sections) {
    for (const n of section.atomicNumbers) sectionByNumber.set(n, section);
  }
  return {
    elements,
    sections,
    sectionOf(atomicNumber) {
      const section = sectionByNumber.get(atomicNumber);
      if (!section) throw new Error(`No section contains element ${atomicNumber}`);
      return section;
    },
    config: { masteryStreak: config.masteryStreak, unlockThreshold: config.unlockThreshold },
  };
}
