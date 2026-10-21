import { buildCumulativeReview } from "@/domain/study/cumulative-review.service";
import { applyReview, MAX_SESSION_HISTORY } from "@/domain/study/progress.service";
import { isSectionUnlocked, resolveUnlocks } from "@/domain/study/section-unlock.service";
import {
  answerCurrentCard,
  buildLearnQueue,
  buildReviewQueue,
  createSession,
  currentCardId,
  recordUnlocks,
  revealCurrentCard,
  summarizeSession,
} from "@/domain/study/session.service";
import { isSuccessfulRecall } from "@/domain/study/spaced-repetition.service";
import type {
  CardId,
  ProgressRecord,
  RecallRating,
  Section,
  SessionMode,
  SessionSummary,
  StudySession,
} from "@/domain/study/types";
import type { ControllerDeps } from "./types";

export type StartSessionResult =
  | { ok: true; session: StudySession }
  | { ok: false; reason: "locked" | "no-cards" | "unknown-section" };

export interface RateOutcome {
  cardId: CardId;
  rating: RecallRating;
  sessionCompleted: boolean;
  summary: SessionSummary | null;
  newlyUnlocked: Section[];
}

export function createStudyController(deps: ControllerDeps) {
  const { catalog, repository, studyStore, settingsStore, clock, random, createId } = deps;

  function commit(progress: ProgressRecord) {
    studyStore.getState().setProgress(progress);
    repository.saveProgress(progress).catch(() => {
      studyStore.getState().setNotice({
        kind: "persist-failed",
        message: "Progress couldn't be saved to this browser. Export a backup to keep it safe.",
      });
    });
  }

  function buildQueue(mode: SessionMode, sectionId: number | null): CardId[] {
    const { progress } = studyStore.getState();
    const { settings } = settingsStore.getState();
    const input = {
      catalog,
      progress,
      kinds: settings.cardKinds,
      size: settings.sessionSize,
      now: clock(),
      random,
    };
    switch (mode) {
      case "learn":
        return buildLearnQueue({ ...input, sectionId: sectionId! });
      case "review":
        return buildReviewQueue(input);
      case "cumulative":
        return buildCumulativeReview(input);
    }
  }

  return {
    startSession(mode: SessionMode, sectionId: number | null = null): StartSessionResult {
      const { progress } = studyStore.getState();
      if (mode === "learn") {
        if (sectionId === null || !catalog.sections.some((s) => s.id === sectionId)) {
          return { ok: false, reason: "unknown-section" };
        }
        if (!isSectionUnlocked(progress, sectionId)) return { ok: false, reason: "locked" };
      }
      const queue = buildQueue(mode, mode === "learn" ? sectionId : null);
      if (queue.length === 0) return { ok: false, reason: "no-cards" };
      const session = createSession({
        id: createId(),
        mode,
        sectionId: mode === "learn" ? sectionId : null,
        queue,
        now: clock(),
      });
      studyStore.getState().setLastSummary(null);
      commit({ ...progress, activeSession: session, updatedAt: clock() });
      return { ok: true, session };
    },

    revealCard(): void {
      const { progress } = studyStore.getState();
      if (!progress.activeSession) return;
      const session = revealCurrentCard(progress.activeSession);
      if (session !== progress.activeSession) studyStore.getState().setProgress({ ...progress, activeSession: session });
    },

    /**
     * Records a recall rating: reschedules the card, advances the session,
     * unlocks sections whose mastery threshold is now met, and persists.
     */
    rateCard(rating: RecallRating): RateOutcome | null {
      const { progress } = studyStore.getState();
      const session = progress.activeSession;
      const cardId = session ? currentCardId(session) : null;
      if (!session || !cardId) return null;
      const now = clock();

      let next = applyReview(progress, cardId, rating, now);
      let nextSession = answerCurrentCard(session, rating, now);

      let newlyUnlocked: Section[] = [];
      if (isSuccessfulRecall(rating)) {
        const unlocks = resolveUnlocks(catalog, next, settingsStore.getState().settings.cardKinds);
        if (unlocks.newlyUnlocked.length > 0) {
          next = { ...next, unlockedSectionIds: unlocks.unlockedSectionIds };
          nextSession = recordUnlocks(nextSession, unlocks.newlyUnlocked);
          newlyUnlocked = catalog.sections.filter((s) => unlocks.newlyUnlocked.includes(s.id));
        }
      }

      let summary: SessionSummary | null = null;
      if (nextSession.completedAt !== null) {
        summary = summarizeSession(nextSession);
        next = {
          ...next,
          activeSession: null,
          sessionHistory: [...next.sessionHistory, summary].slice(-MAX_SESSION_HISTORY),
        };
        studyStore.getState().setLastSummary(summary);
      } else {
        next = { ...next, activeSession: nextSession };
      }

      commit(next);
      return { cardId, rating, sessionCompleted: summary !== null, summary, newlyUnlocked };
    },

    /** Ends the session early; answers already given keep their scheduling effects. */
    endSession(): SessionSummary | null {
      const { progress } = studyStore.getState();
      const session = progress.activeSession;
      if (!session) return null;
      const summary = session.answers.length > 0 ? summarizeSession({ ...session, completedAt: clock() }) : null;
      commit({
        ...progress,
        activeSession: null,
        sessionHistory: summary
          ? [...progress.sessionHistory, summary].slice(-MAX_SESSION_HISTORY)
          : progress.sessionHistory,
        updatedAt: clock(),
      });
      studyStore.getState().setLastSummary(summary);
      return summary;
    },

    dismissSummary(): void {
      studyStore.getState().setLastSummary(null);
    },
  };
}

export type StudyController = ReturnType<typeof createStudyController>;
