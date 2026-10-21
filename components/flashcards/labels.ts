import type { CardKind, MasteryLevel, SessionMode } from "@/domain/study/types";

export const MODE_LABELS: Record<SessionMode, string> = {
  learn: "Learning",
  review: "Spaced review",
  cumulative: "Cumulative review",
};

export const CARD_KIND_LABELS: Record<CardKind, string> = {
  "symbol-to-name": "Symbol → name",
  "name-to-symbol": "Name → symbol",
  "number-to-element": "Atomic number → element",
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  new: "Not studied",
  learning: "Learning",
  mastered: "Mastered",
};
