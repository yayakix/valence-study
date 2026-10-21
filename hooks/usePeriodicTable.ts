"use client";

import { useMemo, useState } from "react";
import { useStore } from "zustand";
import { catalog } from "@/controllers";
import type { ChemicalElement, ElementCategory } from "@/domain/elements/types";
import { cardMasteryLevel, elementMastery } from "@/domain/study/mastery.service";
import { toCardId } from "@/domain/study/flashcard.service";
import type { CardKind, CardReviewState, MasteryLevel, MasterySummary } from "@/domain/study/types";
import { settingsStore } from "@/stores/settings.store";
import { studyStore } from "@/stores/study.store";

export interface TableCell {
  element: ChemicalElement;
  sectionId: number;
  unlocked: boolean;
  mastery: MasterySummary;
  level: MasteryLevel;
  matchesFilter: boolean;
}

export interface ElementDetail extends TableCell {
  cards: { kind: CardKind; level: MasteryLevel; state: CardReviewState | undefined }[];
}

export function usePeriodicTable() {
  const ready = useStore(studyStore, (s) => s.status === "ready");
  const progress = useStore(studyStore, (s) => s.progress);
  const kinds = useStore(settingsStore, (s) => s.settings.cardKinds);
  const [categoryFilter, setCategoryFilter] = useState<ElementCategory | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const streak = catalog.config.masteryStreak;

  const cells = useMemo<TableCell[]>(
    () =>
      catalog.elements.map((element) => {
        const mastery = elementMastery(element.atomicNumber, kinds, progress.cards, streak);
        const sectionId = catalog.sectionOf(element.atomicNumber).id;
        return {
          element,
          sectionId,
          unlocked: progress.unlockedSectionIds.includes(sectionId),
          mastery,
          level: mastery.mastered === mastery.total ? "mastered" : mastery.unseen === mastery.total ? "new" : "learning",
          matchesFilter: categoryFilter === null || element.category === categoryFilter,
        };
      }),
    [progress, kinds, categoryFilter, streak],
  );

  const selected = useMemo<ElementDetail | null>(() => {
    const cell = cells.find((c) => c.element.atomicNumber === selectedNumber);
    if (!cell) return null;
    return {
      ...cell,
      cards: kinds.map((kind) => {
        const state = progress.cards[toCardId(cell.element.atomicNumber, kind)];
        return { kind, level: cardMasteryLevel(state, streak), state };
      }),
    };
  }, [cells, selectedNumber, kinds, progress.cards, streak]);

  return {
    ready,
    cells,
    selected,
    select: setSelectedNumber,
    categoryFilter,
    setCategoryFilter,
  };
}
