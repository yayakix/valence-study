import type { Deck } from "@/domain/decks/types";
import { NATO_DECK } from "./nato";

export const DECKS: readonly Deck[] = [NATO_DECK];

export function getDeck(id: string): Deck | undefined {
  return DECKS.find((deck) => deck.id === id);
}
