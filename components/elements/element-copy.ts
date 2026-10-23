import { getCategory, SYMBOL_ORIGINS } from "@/data";
import { formatAtomicMass } from "@/domain/elements/queries";
import type { ChemicalElement } from "@/domain/elements/types";

function withArticle(phrase: string): string {
  return `${/^[aeiou]/i.test(phrase) ? "an" : "a"} ${phrase}`;
}

export function formatPhase(element: ChemicalElement): string {
  return element.phase === "unknown" ? "Unknown" : element.phase[0]!.toUpperCase() + element.phase.slice(1);
}

export function symbolOrigin(element: ChemicalElement): string | null {
  const origin = SYMBOL_ORIGINS[element.atomicNumber];
  if (!origin) return null;
  const meaning = origin.meaning ? `, meaning “${origin.meaning}”` : "";
  return `The symbol ${element.symbol} comes from “${origin.word}”, the ${origin.language} name for ${element.name.toLowerCase()}${meaning}.`;
}

/** Plain-language summary used as the page intro and meta description. */
export function describeElement(element: ChemicalElement): string {
  const { name, symbol, atomicNumber, period, group, block } = element;
  const kind =
    element.category === "unknown"
      ? "a superheavy synthetic element"
      : withArticle(getCategory(element.category).label.toLowerCase());
  const place = group === null ? `period ${period}` : `period ${period}, group ${group}`;
  const phase =
    element.phase === "unknown"
      ? "Its state at room temperature has not been measured."
      : `At room temperature it is ${withArticle(element.phase)}.`;
  const mass = element.massIsMostStableIsotope
    ? `Its most stable isotope has a mass number of ${element.atomicMass}.`
    : `Its standard atomic weight is ${formatAtomicMass(element)}.`;
  return `${name} (${symbol}) is a chemical element with atomic number ${atomicNumber}. It is ${kind} in ${place} of the periodic table, in the ${block}-block. ${phase} ${mass}`;
}
