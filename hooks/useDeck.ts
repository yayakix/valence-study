"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useStore } from "zustand";
import { deckController } from "@/controllers";
import type { DeckStartRequest } from "@/controllers/deck.controller";
import { getDeck } from "@/data/decks";
import { buildDeckCard, deckSections } from "@/domain/decks/deck.service";
import {
  countDeckDue,
  deckItemsMastery,
  deckMastery,
  rangeLabel,
  sectionRange,
} from "@/domain/decks/deck-study.service";
import type { DeckRange } from "@/domain/decks/types";
import { currentCardId, sessionProgress } from "@/domain/study/session.service";
import { formatInterval, previewIntervals } from "@/domain/study/spaced-repetition.service";
import type { RecallRating } from "@/domain/study/types";
import { deckStore, IDLE_DECK } from "@/stores/deck.store";
import { refreshNow, useNow } from "./useNow";

export function useDeck(deckId: string) {
  const deck = getDeck(deckId);
  if (!deck) throw new Error(`Unknown deck: ${deckId}`);
  const state = useStore(deckStore, (s) => s.decks[deckId] ?? IDLE_DECK);
  const now = useNow();
  const { progress } = state;

  useEffect(() => {
    void deckController.hydrate(deckId);
  }, [deckId]);

  const sections = useMemo(() => {
    if (!progress) return [];
    return deckSections(deck).map((section) => ({
      ...section,
      range: sectionRange(deck, section),
      unlocked: progress.unlockedSectionIds.includes(section.id),
      mastery: deckItemsMastery(progress, section.itemIds),
    }));
  }, [deck, progress]);

  const active = useMemo(() => {
    const session = progress?.activeSession;
    if (!progress || !session) return null;
    const id = currentCardId(session);
    const card = id ? buildDeckCard(deck, id) : null;
    const intervals = id ? previewIntervals(progress.cards[id], id, now || session.startedAt) : null;
    return {
      session,
      card,
      revealed: session.revealed,
      progress: sessionProgress(session),
      intervalLabels: intervals
        ? (Object.fromEntries(
            Object.entries(intervals).map(([rating, ms]) => [rating, formatInterval(ms)]),
          ) as Record<RecallRating, string>)
        : null,
      isRepeat: id ? (session.requeueCounts[id] ?? 0) > 0 && session.answers.some((a) => a.cardId === id) : false,
    };
  }, [deck, progress, now]);

  const rate = useCallback(
    (rating: RecallRating) => {
      const outcome = deckController.rate(deckId, rating);
      refreshNow();
      return outcome;
    },
    [deckId],
  );

  const startRound = useCallback(() => deckController.startRound(deckId), [deckId]);
  const dismissSummary = useCallback(() => deckController.dismissSummary(deckId), [deckId]);

  return {
    deck,
    ready: state.status === "ready" && progress !== null,
    progress,
    sections,
    mastery: progress ? deckMastery(deck, progress) : null,
    dueCount: progress && now ? countDeckDue(deck, progress, now) : 0,
    range: progress?.range ?? null,
    rangeLabel: rangeLabel(deck, progress?.range ?? null),
    active,
    lastSummary: state.lastSummary,
    start: (request: DeckStartRequest) => deckController.startSession(deckId, request),
    startRound,
    setRange: (range: DeckRange | null) => deckController.setRange(deckId, range),
    reveal: () => deckController.reveal(deckId),
    rate,
    end: () => deckController.endSession(deckId),
    dismissSummary,
    setPrompts: (promptIds: readonly string[]) => deckController.setPrompts(deckId, promptIds),
    reset: () => deckController.reset(deckId),
  };
}
