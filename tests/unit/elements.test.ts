import { describe, expect, it } from "vitest";
import { CATEGORIES, ELEMENTS } from "@/data";
import { placeElement } from "@/data/elements";
import { findElement, formatAtomicMass } from "@/domain/elements/queries";

const bySymbol = (symbol: string) => ELEMENTS.find((e) => e.symbol === symbol)!;

describe("element dataset", () => {
  it("contains all 118 elements in atomic-number order with unique symbols and names", () => {
    expect(ELEMENTS).toHaveLength(118);
    ELEMENTS.forEach((element, i) => expect(element.atomicNumber).toBe(i + 1));
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(118);
    expect(new Set(ELEMENTS.map((e) => e.name)).size).toBe(118);
  });

  it("gives every element a known category", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const element of ELEMENTS) expect(ids.has(element.category)).toBe(true);
  });

  it("has atomic masses that broadly increase with atomic number", () => {
    for (const element of ELEMENTS) {
      expect(element.atomicMass).toBeGreaterThan(element.atomicNumber);
      expect(element.atomicMass).toBeLessThan(element.atomicNumber * 3);
    }
  });

  it.each([
    ["H", 1, 1, "s"],
    ["He", 1, 18, "s"],
    ["O", 2, 16, "p"],
    ["Fe", 4, 8, "d"],
    ["Ag", 5, 11, "d"],
    ["Au", 6, 11, "d"],
    ["Pb", 6, 14, "p"],
    ["Rn", 6, 18, "p"],
    ["Og", 7, 18, "p"],
  ] as const)("places %s in period %i, group %i", (symbol, period, group, block) => {
    const element = bySymbol(symbol);
    expect(element.period).toBe(period);
    expect(element.group).toBe(group);
    expect(element.block).toBe(block);
    expect(element.position).toEqual({ row: period, column: group });
  });

  it("places lanthanides and actinides in the detached f-block rows", () => {
    expect(placeElement(57).position).toEqual({ row: 9, column: 3 });
    expect(placeElement(71).position).toEqual({ row: 9, column: 17 });
    expect(placeElement(92).position).toEqual({ row: 10, column: 6 });
    expect(bySymbol("U").group).toBeNull();
    expect(ELEMENTS.filter((e) => e.category === "lanthanide")).toHaveLength(15);
    expect(ELEMENTS.filter((e) => e.category === "actinide")).toHaveLength(15);
  });

  it("never puts two elements in the same grid cell", () => {
    const cells = new Set(ELEMENTS.map((e) => `${e.position.row}:${e.position.column}`));
    expect(cells.size).toBe(118);
  });

  it("marks only bromine and mercury as liquids", () => {
    expect(ELEMENTS.filter((e) => e.phase === "liquid").map((e) => e.symbol)).toEqual(["Br", "Hg"]);
  });

  it("finds elements by number, symbol, name, or alternative spelling", () => {
    expect(findElement(ELEMENTS, "26")?.symbol).toBe("Fe");
    expect(findElement(ELEMENTS, "na")?.name).toBe("Sodium");
    expect(findElement(ELEMENTS, "Aluminium")?.symbol).toBe("Al");
    expect(findElement(ELEMENTS, "")).toBeUndefined();
  });

  it("brackets masses of elements without a standard atomic weight", () => {
    expect(formatAtomicMass(bySymbol("Tc"))).toBe("[98]");
    expect(formatAtomicMass(bySymbol("U"))).toBe("238.03");
  });
});
