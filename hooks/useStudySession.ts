"use client";

import { useCallback, useMemo } from "react";
import { useStore } from "zustand";
import { catalog, studyController } from "@/controllers";
import type { RateOutcome, StartSessionResult } from "@/controllers/study.controller";
import { getFlashcard } from "@/domain/study/flashcard.service";
import { currentCardId, sessionProgress } from "@/domain/study/session.service";
import { formatInterval, previewIntervals } from "@/domain/study/spaced-repetition.service";
import type { RecallRating, SessionMode } from "@/domain/study/types";
import { studyStore } from "@/stores/study.store";
import { refreshNow, useNow } from "./useNow";

export function useStudySession() {
  const ready = useStore(studyStore, (s) => s.status === "ready");
  const session = useStore(studyStore, (s) => s.progress.activeSession);
  const cards = useStore(studyStore, (s) => s.progress.cards);
  const lastSummary = useStore(studyStore, (s) => s.lastSummary);
  const now = useNow();

  const view = useMemo(() => {
    if (!session) return null;
    const id = currentCardId(session);
    const card = id ? getFlashcard(catalog, id) : null;
    const intervals = id ? previewIntervals(cards[id], id, now || session.startedAt) : null;
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
      section: session.sectionId ? (catalog.sections.find((s) => s.id === session.sectionId) ?? null) : null,
      isRepeat: id ? (session.requeueCounts[id] ?? 0) > 0 && session.answers.some((a) => a.cardId === id) : false,
    };
  }, [session, cards, now]);

  const start = useCallback(
    (mode: SessionMode, sectionId: number | null = null): StartSessionResult =>
      studyController.startSession(mode, sectionId),
    [],
  );
  const rate = useCallback((rating: RecallRating): RateOutcome | null => {
    const outcome = studyController.rateCard(rating);
    refreshNow();
    return outcome;
  }, []);

  return {
    ready,
    active: view,
    lastSummary,
    start,
    reveal: studyController.revealCard,
    rate,
    end: studyController.endSession,
    dismissSummary: studyController.dismissSummary,
  };
}
