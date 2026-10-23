import type { CardReviewState, SessionSummary, StudySession } from "@/domain/study/types";

export interface DeckField {
  id: string;
  label: string;
}

/** One card type: show `from`, recall `to`. */
export interface DeckPrompt {
  id: string;
  from: string;
  to: string;
  label: string;
  question: string;
}

export interface DeckItem {
  /** Stable id used in card ids; must not contain ":". */
  id: string;
  fields: Record<string, string>;
}

export interface Deck {
  id: string;
  title: string;
  shortTitle: string;
  /** Plural noun for items, used in range labels, e.g. "letters". */
  itemNoun: string;
  description: string;
  fields: readonly DeckField[];
  prompts: readonly DeckPrompt[];
  /** Field used to name sections, e.g. "A–J". */
  sectionLabelField: string;
  /** Optional field shown under the answer for extra context. */
  detailField?: string;
  items: readonly DeckItem[];
  sectionSize: number;
}

export interface DeckRange {
  start: number;
  end: number;
}

export interface DeckSection {
  id: number;
  title: string;
  itemIds: string[];
}

/** `${itemId}:${promptId}`, scoped to one deck. */
export type DeckCardId = `${string}:${string}`;

export const DECK_SESSION_MODES = ["learn", "review", "custom"] as const;
export type DeckSessionMode = (typeof DECK_SESSION_MODES)[number];

export type DeckSession = StudySession<DeckCardId, DeckSessionMode>;
export type DeckSessionSummary = SessionSummary<DeckSessionMode>;

export interface DeckProgress {
  cards: Partial<Record<DeckCardId, CardReviewState<DeckCardId>>>;
  unlockedSectionIds: number[];
  /** Card types the learner is studying; mastery and unlocks count only these. */
  promptIds: string[];
  /** Inclusive item positions (0-based) to practice; null means the whole deck. */
  range: DeckRange | null;
  activeSession: DeckSession | null;
  sessionHistory: DeckSessionSummary[];
  updatedAt: number;
}

export interface DeckCard {
  id: DeckCardId;
  item: DeckItem;
  prompt: DeckPrompt;
  question: string;
  front: string;
  answer: string;
  detail: string | null;
}

export const DECK_RULES = {
  masteryStreak: 3,
  unlockThreshold: 0.8,
  maxSessionHistory: 50,
} as const;
