import { createStore } from "zustand/vanilla";
import type { DeckProgress, DeckSessionSummary } from "@/domain/decks/types";
import type { HydrationStatus } from "./study.store";

export interface DeckState {
  status: HydrationStatus;
  progress: DeckProgress | null;
  /** Summary of the session that just finished, shown until dismissed. */
  lastSummary: DeckSessionSummary | null;
}

export const IDLE_DECK: DeckState = { status: "idle", progress: null, lastSummary: null };

export interface DeckStore {
  decks: Record<string, DeckState>;
  updateDeck(deckId: string, patch: Partial<DeckState>): void;
}

export function createDeckStore() {
  return createStore<DeckStore>()((set) => ({
    decks: {},
    updateDeck: (deckId, patch) =>
      set((state) => ({ decks: { ...state.decks, [deckId]: { ...(state.decks[deckId] ?? IDLE_DECK), ...patch } } })),
  }));
}

export type DeckStoreApi = ReturnType<typeof createDeckStore>;

export const deckStore = createDeckStore();
