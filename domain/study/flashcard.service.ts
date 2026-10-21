import type { ChemicalElement } from "@/domain/elements/types";
import { CARD_KINDS, type CardId, type CardKind, type Flashcard, type StudyCatalog } from "./types";

const CATEGORY_LABELS: Record<ChemicalElement["category"], string> = {
  "alkali-metal": "alkali metal",
  "alkaline-earth-metal": "alkaline earth metal",
  "transition-metal": "transition metal",
  "post-transition-metal": "post-transition metal",
  metalloid: "metalloid",
  "reactive-nonmetal": "reactive nonmetal",
  "noble-gas": "noble gas",
  lanthanide: "lanthanide",
  actinide: "actinide",
  unknown: "superheavy element",
};

export function toCardId(atomicNumber: number, kind: CardKind): CardId {
  return `${atomicNumber}:${kind}`;
}

export function parseCardId(id: string): { atomicNumber: number; kind: CardKind } | null {
  const [numberPart, kind, ...rest] = id.split(":");
  if (rest.length > 0 || !numberPart || !kind) return null;
  const atomicNumber = Number(numberPart);
  if (!Number.isInteger(atomicNumber) || atomicNumber < 1) return null;
  if (!(CARD_KINDS as readonly string[]).includes(kind)) return null;
  return { atomicNumber, kind: kind as CardKind };
}

export function createFlashcard(element: ChemicalElement, kind: CardKind, sectionId: number): Flashcard {
  const position =
    element.group === null
      ? `period ${element.period}, f-block`
      : `period ${element.period}, group ${element.group}`;
  const detail = `Atomic number ${element.atomicNumber} · ${CATEGORY_LABELS[element.category]} · ${position}`;
  const base = { id: toCardId(element.atomicNumber, kind), atomicNumber: element.atomicNumber, kind, sectionId };

  switch (kind) {
    case "symbol-to-name":
      return { ...base, prompt: element.symbol, question: "Which element has this symbol?", answer: element.name, answerDetail: detail };
    case "name-to-symbol":
      return { ...base, prompt: element.name, question: "What is its chemical symbol?", answer: element.symbol, answerDetail: detail };
    case "number-to-element":
      return {
        ...base,
        prompt: String(element.atomicNumber),
        question: "Which element has this atomic number?",
        answer: `${element.name} (${element.symbol})`,
        answerDetail: detail,
      };
  }
}

export function generateFlashcards(
  catalog: StudyCatalog,
  kinds: readonly CardKind[],
  atomicNumbers?: readonly number[],
): Flashcard[] {
  const wanted = atomicNumbers ? new Set(atomicNumbers) : null;
  const orderedKinds = CARD_KINDS.filter((kind) => kinds.includes(kind));
  return catalog.elements
    .filter((element) => !wanted || wanted.has(element.atomicNumber))
    .flatMap((element) =>
      orderedKinds.map((kind) => createFlashcard(element, kind, catalog.sectionOf(element.atomicNumber).id)),
    );
}

export function cardIdsForSections(
  catalog: StudyCatalog,
  sectionIds: readonly number[],
  kinds: readonly CardKind[],
): CardId[] {
  const orderedKinds = CARD_KINDS.filter((kind) => kinds.includes(kind));
  return catalog.sections
    .filter((section) => sectionIds.includes(section.id))
    .flatMap((section) => section.atomicNumbers.flatMap((n) => orderedKinds.map((kind) => toCardId(n, kind))));
}

export function getFlashcard(catalog: StudyCatalog, id: CardId): Flashcard | null {
  const parsed = parseCardId(id);
  if (!parsed) return null;
  const element = catalog.elements.find((e) => e.atomicNumber === parsed.atomicNumber);
  if (!element) return null;
  return createFlashcard(element, parsed.kind, catalog.sectionOf(element.atomicNumber).id);
}
