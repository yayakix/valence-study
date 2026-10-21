export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth-metal"
  | "transition-metal"
  | "post-transition-metal"
  | "metalloid"
  | "reactive-nonmetal"
  | "noble-gas"
  | "lanthanide"
  | "actinide"
  | "unknown";

export type ElementBlock = "s" | "p" | "d" | "f";

export type StandardPhase = "solid" | "liquid" | "gas" | "unknown";

export interface ChemicalElement {
  atomicNumber: number;
  symbol: string;
  name: string;
  /** Accepted alternative spellings, e.g. "Aluminium". */
  altNames: readonly string[];
  /** Standard atomic weight, or the mass number of the most stable isotope. */
  atomicMass: number;
  massIsMostStableIsotope: boolean;
  category: ElementCategory;
  period: number;
  /** IUPAC group 1–18; null for the f-block rows. */
  group: number | null;
  block: ElementBlock;
  phase: StandardPhase;
  /** 1-based CSS grid placement in an 18 × 10 table (rows 9–10 hold the f-block). */
  position: { row: number; column: number };
}

export interface CategoryDefinition {
  id: ElementCategory;
  label: string;
  description: string;
}
