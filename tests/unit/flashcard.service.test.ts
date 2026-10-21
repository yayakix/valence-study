import { describe, expect, it } from "vitest";
import { ELEMENTS } from "@/data";
import { groupIntoSections } from "@/domain/study/catalog.service";
import {
  cardIdsForSections,
  createFlashcard,
  generateFlashcards,
  getFlashcard,
  parseCardId,
  toCardId,
} from "@/domain/study/flashcard.service";
import { CARD_KINDS } from "@/domain/study/types";
import { catalog } from "../helpers";

describe("groupIntoSections", () => {
  it("splits the table into sequential sections of ten, with a short final section", () => {
    const sections = groupIntoSections(ELEMENTS, 10);
    expect(sections).toHaveLength(12);
    expect(sections[0]!.atomicNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(sections[0]!.title).toBe("Hydrogen to Neon");
    expect(sections[11]!.atomicNumbers).toEqual([111, 112, 113, 114, 115, 116, 117, 118]);
    expect(sections.flatMap((s) => s.atomicNumbers)).toHaveLength(118);
  });

  it("orders by atomic number even if input is shuffled", () => {
    const sections = groupIntoSections([...ELEMENTS].reverse(), 50);
    expect(sections.map((s) => s.from.atomicNumber)).toEqual([1, 51, 101]);
  });

  it("rejects invalid sizes", () => {
    expect(() => groupIntoSections(ELEMENTS, 0)).toThrow();
  });

  it("looks up the section containing an element", () => {
    expect(catalog.sectionOf(1).id).toBe(1);
    expect(catalog.sectionOf(26).id).toBe(3);
    expect(catalog.sectionOf(118).id).toBe(12);
    expect(() => catalog.sectionOf(119)).toThrow();
  });
});

describe("flashcards", () => {
  const iron = ELEMENTS[25]!;

  it("creates each card kind with a prompt and answer", () => {
    expect(createFlashcard(iron, "symbol-to-name", 3)).toMatchObject({ id: "26:symbol-to-name", prompt: "Fe", answer: "Iron" });
    expect(createFlashcard(iron, "name-to-symbol", 3)).toMatchObject({ prompt: "Iron", answer: "Fe" });
    expect(createFlashcard(iron, "number-to-element", 3)).toMatchObject({ prompt: "26", answer: "Iron (Fe)" });
    expect(createFlashcard(iron, "symbol-to-name", 3).answerDetail).toContain("group 8");
  });

  it("generates one card per element per enabled kind", () => {
    expect(generateFlashcards(catalog, CARD_KINDS)).toHaveLength(118 * 3);
    const section1 = generateFlashcards(catalog, ["name-to-symbol"], catalog.sections[0]!.atomicNumbers);
    expect(section1.map((c) => c.prompt)).toEqual([
      "Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon",
    ]);
    expect(section1.every((c) => c.sectionId === 1)).toBe(true);
  });

  it("lists card ids for sections in a stable order", () => {
    const ids = cardIdsForSections(catalog, [2], ["name-to-symbol", "symbol-to-name"]);
    expect(ids).toHaveLength(20);
    expect(ids.slice(0, 2)).toEqual(["11:symbol-to-name", "11:name-to-symbol"]);
  });

  it("round-trips and rejects card ids", () => {
    expect(parseCardId(toCardId(79, "number-to-element"))).toEqual({ atomicNumber: 79, kind: "number-to-element" });
    expect(parseCardId("79:unknown")).toBeNull();
    expect(parseCardId("x:symbol-to-name")).toBeNull();
    expect(parseCardId("1:symbol-to-name:extra")).toBeNull();
    expect(getFlashcard(catalog, toCardId(1, "symbol-to-name"))?.answer).toBe("Hydrogen");
    expect(getFlashcard(catalog, "999:symbol-to-name")).toBeNull();
  });
});
