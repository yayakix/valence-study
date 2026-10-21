import type { CategoryDefinition, ElementCategory } from "@/domain/elements/types";

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    id: "alkali-metal",
    label: "Alkali metal",
    description: "Soft, highly reactive metals in group 1 that form +1 ions.",
  },
  {
    id: "alkaline-earth-metal",
    label: "Alkaline earth metal",
    description: "Reactive group 2 metals that form +2 ions.",
  },
  {
    id: "transition-metal",
    label: "Transition metal",
    description: "d-block metals, often with several oxidation states and colored compounds.",
  },
  {
    id: "post-transition-metal",
    label: "Post-transition metal",
    description: "Softer p-block metals with lower melting points than transition metals.",
  },
  {
    id: "metalloid",
    label: "Metalloid",
    description: "Elements with properties between metals and nonmetals; many are semiconductors.",
  },
  {
    id: "reactive-nonmetal",
    label: "Reactive nonmetal",
    description: "Nonmetals that readily form covalent bonds, including the halogens.",
  },
  {
    id: "noble-gas",
    label: "Noble gas",
    description: "Group 18 gases with full valence shells and very low reactivity.",
  },
  {
    id: "lanthanide",
    label: "Lanthanide",
    description: "The 4f series from lanthanum to lutetium, known as rare earth metals.",
  },
  {
    id: "actinide",
    label: "Actinide",
    description: "The 5f series from actinium to lawrencium; all are radioactive.",
  },
  {
    id: "unknown",
    label: "Unknown properties",
    description: "Superheavy synthetic elements whose chemistry has barely been measured.",
  },
];

const BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export function getCategory(id: ElementCategory): CategoryDefinition {
  const category = BY_ID.get(id);
  if (!category) throw new Error(`Unknown element category: ${id}`);
  return category;
}
