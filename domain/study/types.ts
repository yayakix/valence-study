import type { ChemicalElement } from "@/domain/elements/types";

export const CARD_KINDS = ["symbol-to-name", "name-to-symbol", "number-to-element"] as const;
export type CardKind = (typeof CARD_KINDS)[number];

/** Stable card identifier: `${atomicNumber}:${kind}`. */
export type CardId = `${number}:${CardKind}`;

export interface Flashcard {
  id: CardId;
  atomicNumber: number;
  kind: CardKind;
  sectionId: number;
  prompt: string;
  question: string;
  answer: string;
  answerDetail: string;
}

export const RECALL_RATINGS = ["again", "hard", "good", "easy"] as const;
export type RecallRating = (typeof RECALL_RATINGS)[number];

export interface ReviewLogEntry {
  reviewedAt: number;
  rating: RecallRating;
  /** Interval scheduled as a result of this review. */
  intervalDays: number;
}

export interface CardReviewState<Id extends string = CardId> {
  cardId: Id;
  easeFactor: number;
  intervalDays: number;
  /** Consecutive successful recalls; reset by "again". */
  repetitions: number;
  lapses: number;
  dueAt: number;
  lastReviewedAt: number | null;
  history: ReviewLogEntry[];
}

export interface Section {
  id: number;
  title: string;
  subtitle: string;
  atomicNumbers: number[];
  from: ChemicalElement;
  to: ChemicalElement;
}

export const SESSION_MODES = ["learn", "review", "cumulative"] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

export interface SessionAnswer<Id extends string = CardId> {
  cardId: Id;
  rating: RecallRating;
  answeredAt: number;
}

export interface StudySession<Id extends string = CardId, Mode extends string = SessionMode> {
  id: string;
  mode: Mode;
  sectionId: number | null;
  queue: Id[];
  position: number;
  revealed: boolean;
  answers: SessionAnswer<Id>[];
  requeueCounts: Partial<Record<Id, number>>;
  unlockedDuringSession: number[];
  startedAt: number;
  completedAt: number | null;
}

export type RatingCounts = Record<RecallRating, number>;

export interface SessionSummary<Mode extends string = SessionMode> {
  id: string;
  mode: Mode;
  sectionId: number | null;
  startedAt: number;
  completedAt: number;
  totalAnswers: number;
  uniqueCards: number;
  correct: number;
  accuracy: number;
  ratings: RatingCounts;
  unlockedSectionIds: number[];
}

export interface ProgressRecord {
  cards: Partial<Record<CardId, CardReviewState>>;
  unlockedSectionIds: number[];
  activeSession: StudySession | null;
  sessionHistory: SessionSummary[];
  updatedAt: number;
}

export interface StudySettings {
  sessionSize: number;
  /** Inclusive range of atomic numbers drawn in the blank-table number drill. */
  drillMinNumber: number;
  drillMaxNumber: number;
  cardKinds: CardKind[];
}

export type MasteryLevel = "new" | "learning" | "mastered";

export interface MasterySummary {
  total: number;
  mastered: number;
  learning: number;
  unseen: number;
  /** Fraction of cards that are mastered, 0–1. */
  masteredRatio: number;
  /** Partial-credit score where learning cards count by streak progress, 0–1. */
  score: number;
}

/** Everything the study engine needs to know about the static curriculum. */
export interface StudyCatalog {
  elements: readonly ChemicalElement[];
  sections: readonly Section[];
  sectionOf(atomicNumber: number): Section;
  config: {
    masteryStreak: number;
    unlockThreshold: number;
  };
}
