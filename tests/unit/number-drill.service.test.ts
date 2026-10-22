import { describe, expect, it } from "vitest";
import { seededRandom } from "@/domain/shared/random";
import {
  advanceNumberDrill,
  createNumberDrill,
  currentNumber,
  revealNumber,
} from "@/domain/study/number-drill.service";

const ALL = Array.from({ length: 118 }, (_, i) => i + 1);

describe("number drill", () => {
  it("shows every number exactly once per round", () => {
    const random = seededRandom(3);
    let drill = createNumberDrill(ALL, random);
    const seen = [currentNumber(drill)];
    for (let i = 1; i < ALL.length; i++) {
      drill = advanceNumberDrill(drill, random);
      seen.push(currentNumber(drill));
    }
    expect([...seen].sort((a, b) => a - b)).toEqual(ALL);
    expect(drill.round).toBe(1);
  });

  it("reveals, then hides again on the next number", () => {
    const random = seededRandom(1);
    let drill = revealNumber(createNumberDrill(ALL, random));
    expect(drill.revealed).toBe(true);
    expect(revealNumber(drill)).toBe(drill);
    drill = advanceNumberDrill(drill, random);
    expect(drill.revealed).toBe(false);
  });

  it("starts a new round without repeating the last number back to back", () => {
    for (let seed = 0; seed < 50; seed++) {
      const random = seededRandom(seed);
      let drill = createNumberDrill([1, 2, 3], random);
      drill = advanceNumberDrill(advanceNumberDrill(drill, random), random);
      const last = currentNumber(drill);
      drill = advanceNumberDrill(drill, random);
      expect(drill.round).toBe(2);
      expect(currentNumber(drill)).not.toBe(last);
    }
  });

  it("rejects an empty deck", () => {
    expect(() => createNumberDrill([], seededRandom(1))).toThrow();
  });
});
