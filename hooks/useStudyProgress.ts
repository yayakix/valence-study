"use client";

import { useMemo } from "react";
import { useStore } from "zustand";
import { catalog } from "@/controllers";
import { sectionMastery } from "@/domain/study/mastery.service";
import { nextLockedSection, highestUnlockedSection } from "@/domain/study/section-unlock.service";
import { countDueCards } from "@/domain/study/session.service";
import { computeStudyStats } from "@/domain/study/stats.service";
import type { MasterySummary, Section } from "@/domain/study/types";
import { settingsStore } from "@/stores/settings.store";
import { studyStore } from "@/stores/study.store";
import { useNow } from "./useNow";

export interface SectionProgress {
  section: Section;
  unlocked: boolean;
  isFrontier: boolean;
  mastery: MasterySummary;
  dueCount: number;
}

export function useStudyProgress() {
  const ready = useStore(studyStore, (s) => s.status === "ready");
  const progress = useStore(studyStore, (s) => s.progress);
  const settings = useStore(settingsStore, (s) => s.settings);
  const now = useNow();

  return useMemo(() => {
    const kinds = settings.cardKinds;
    const frontierId = highestUnlockedSection(catalog, progress.unlockedSectionIds).id;
    const sections: SectionProgress[] = catalog.sections.map((section) => {
      const unlocked = progress.unlockedSectionIds.includes(section.id);
      return {
        section,
        unlocked,
        isFrontier: section.id === frontierId,
        mastery: sectionMastery(catalog, section, kinds, progress.cards),
        dueCount: unlocked
          ? countDueCards(catalog, { cards: progress.cards, unlockedSectionIds: [section.id] }, kinds, now)
          : 0,
      };
    });
    return {
      ready,
      progress,
      settings,
      sections,
      frontier: sections.find((s) => s.isFrontier)!,
      nextLocked: nextLockedSection(catalog, progress.unlockedSectionIds),
      stats: computeStudyStats(catalog, progress, kinds, now),
      unlockThreshold: catalog.config.unlockThreshold,
      masteryStreak: catalog.config.masteryStreak,
      recentSessions: [...progress.sessionHistory].reverse(),
      hasActiveSession: progress.activeSession !== null,
    };
  }, [ready, progress, settings, now]);
}
