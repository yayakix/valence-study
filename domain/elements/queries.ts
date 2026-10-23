import type { ChemicalElement, ElementCategory } from "./types";

export function indexByAtomicNumber(
  elements: readonly ChemicalElement[],
): ReadonlyMap<number, ChemicalElement> {
  return new Map(elements.map((element) => [element.atomicNumber, element]));
}

export function findElement(
  elements: readonly ChemicalElement[],
  query: string,
): ChemicalElement | undefined {
  const needle = query.trim().toLowerCase();
  if (!needle) return undefined;
  const asNumber = Number(needle);
  return elements.find(
    (element) =>
      (Number.isInteger(asNumber) && element.atomicNumber === asNumber) ||
      element.symbol.toLowerCase() === needle ||
      element.name.toLowerCase() === needle ||
      element.altNames.some((alt) => alt.toLowerCase() === needle),
  );
}

/** URL slug for an element page, e.g. "iron". */
export function elementSlug(element: ChemicalElement): string {
  return element.name.toLowerCase();
}

export function findElementBySlug(
  elements: readonly ChemicalElement[],
  slug: string,
): ChemicalElement | undefined {
  const needle = slug.toLowerCase();
  return elements.find((element) => elementSlug(element) === needle);
}

export function filterByCategory(
  elements: readonly ChemicalElement[],
  category: ElementCategory,
): ChemicalElement[] {
  return elements.filter((element) => element.category === category);
}

export function formatAtomicMass(element: ChemicalElement): string {
  return element.massIsMostStableIsotope ? `[${element.atomicMass}]` : String(element.atomicMass);
}
