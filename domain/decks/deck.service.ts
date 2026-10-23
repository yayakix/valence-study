import type { Deck, DeckCard, DeckCardId, DeckSection } from "./types";

export function deckCardId(itemId: string, promptId: string): DeckCardId {
  return `${itemId}:${promptId}`;
}

export function parseDeckCardId(id: DeckCardId): { itemId: string; promptId: string } {
  const split = id.lastIndexOf(":");
  return { itemId: id.slice(0, split), promptId: id.slice(split + 1) };
}

export function deckSections(deck: Deck): DeckSection[] {
  const sections: DeckSection[] = [];
  for (let start = 0; start < deck.items.length; start += deck.sectionSize) {
    const items = deck.items.slice(start, start + deck.sectionSize);
    const first = items[0]!.fields[deck.sectionLabelField];
    const last = items.at(-1)!.fields[deck.sectionLabelField];
    sections.push({
      id: sections.length + 1,
      title: first === last ? String(first) : `${first}–${last}`,
      itemIds: items.map((item) => item.id),
    });
  }
  return sections;
}

export function deckCardIds(itemIds: readonly string[], promptIds: readonly string[]): DeckCardId[] {
  return itemIds.flatMap((itemId) => promptIds.map((promptId) => deckCardId(itemId, promptId)));
}

export function buildDeckCard(deck: Deck, id: DeckCardId): DeckCard | null {
  const { itemId, promptId } = parseDeckCardId(id);
  const item = deck.items.find((candidate) => candidate.id === itemId);
  const prompt = deck.prompts.find((candidate) => candidate.id === promptId);
  if (!item || !prompt) return null;
  const detail = deck.detailField ? item.fields[deck.detailField] : undefined;
  return {
    id,
    item,
    prompt,
    question: prompt.question,
    front: item.fields[prompt.from] ?? "",
    answer: item.fields[prompt.to] ?? "",
    detail: detail && detail !== item.fields[prompt.to] ? detail : null,
  };
}

/** Problems that would break card ids or sections; empty when the deck is valid. */
export function validateDeck(deck: Deck): string[] {
  const problems: string[] = [];
  const fieldIds = new Set(deck.fields.map((field) => field.id));
  const itemIds = new Set<string>();
  for (const item of deck.items) {
    if (item.id.includes(":")) problems.push(`Item id "${item.id}" contains ":"`);
    if (itemIds.has(item.id)) problems.push(`Duplicate item id "${item.id}"`);
    itemIds.add(item.id);
    for (const field of fieldIds) if (!item.fields[field]) problems.push(`Item "${item.id}" is missing "${field}"`);
  }
  for (const prompt of deck.prompts) {
    if (prompt.id.includes(":")) problems.push(`Prompt id "${prompt.id}" contains ":"`);
    if (!fieldIds.has(prompt.from) || !fieldIds.has(prompt.to)) problems.push(`Prompt "${prompt.id}" uses unknown fields`);
  }
  if (!fieldIds.has(deck.sectionLabelField)) problems.push("Unknown section label field");
  if (deck.prompts.length === 0) problems.push("Deck has no prompts");
  if (deck.items.length === 0) problems.push("Deck has no items");
  return problems;
}
