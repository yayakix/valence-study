import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { describeElement, symbolOrigin } from "@/components/elements/element-copy";
import { ELEMENTS } from "@/data";
import { DECKS } from "@/data/decks";
import { elementSlug, findElementBySlug } from "@/domain/elements/queries";

const bySymbol = (symbol: string) => ELEMENTS.find((e) => e.symbol === symbol)!;

describe("element slugs", () => {
  it("gives every element a unique, URL-safe slug", () => {
    const slugs = ELEMENTS.map(elementSlug);
    expect(new Set(slugs).size).toBe(ELEMENTS.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]+$/);
  });

  it("finds elements by slug case-insensitively", () => {
    expect(findElementBySlug(ELEMENTS, "iron")?.symbol).toBe("Fe");
    expect(findElementBySlug(ELEMENTS, "Gold")?.symbol).toBe("Au");
    expect(findElementBySlug(ELEMENTS, "unobtainium")).toBeUndefined();
  });
});

describe("element copy", () => {
  it("describes an element in plain language", () => {
    const text = describeElement(bySymbol("Fe"));
    expect(text).toContain("Iron (Fe) is a chemical element with atomic number 26");
    expect(text).toContain("a transition metal in period 4, group 8");
    expect(text).toContain("At room temperature it is a solid.");
  });

  it("handles f-block, unmeasured, and isotope-mass elements", () => {
    const og = describeElement(bySymbol("Og"));
    expect(og).toContain("a superheavy synthetic element");
    expect(og).toContain("most stable isotope has a mass number");
    expect(describeElement(bySymbol("Er"))).toContain("a lanthanide in period 6 of");
    expect(describeElement(bySymbol("Na"))).toContain("an alkali metal");
  });

  it("explains symbols that come from other languages", () => {
    expect(symbolOrigin(bySymbol("Au"))).toContain("aurum");
    expect(symbolOrigin(bySymbol("Hg"))).toContain("water-silver");
    expect(symbolOrigin(bySymbol("O"))).toBeNull();
  });
});

describe("crawler files", () => {
  it("lists the main pages and every element page in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toHaveLength(5 + DECKS.length + ELEMENTS.length);
    expect(urls.some((url) => url.endsWith("/elements/hydrogen"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/periodic-table"))).toBe(true);
  });

  it("points crawlers at the sitemap and keeps personal progress out", () => {
    const result = robots();
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
    expect(JSON.stringify(result.rules)).toContain("/progress");
  });
});
