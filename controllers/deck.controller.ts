import {
  applyDeckReview,
  buildDeckQueue,
  buildDeckReviewQueue,
  createInitialDeckProgress,
  findSection,
  normalizeDeckProgress,
  normalizeDeckRange,
  rangeItemIds,
  resolveDeckUnlocks,
} from "@/domain/decks/deck-study.service";
import {
  DECK_RULES,
  type Deck,
  type DeckProgress,
  type DeckRange,
  type DeckSessionMode,
  type DeckSessionSummary,
} from "@/domain/decks/types";
import type { RandomSource } from "@/domain/shared/random";
import {
  answerCurrentCard,
  createSession,
  currentCardId,
  recordUnlocks,
  revealCurrentCard,
  summarizeSession,
} from "@/domain/study/session.service";
import { isSuccessfulRecall } from "@/domain/study/spaced-repetition.service";
import type { RecallRating } from "@/domain/study/types";
import type { StudyRepository } from "@/lib/persistence/repository";
import { IDLE_DECK, type DeckStoreApi } from "@/stores/deck.store";
import type { SettingsStoreApi } from "@/stores/settings.store";

export interface DeckControllerDeps {
  getDeck: (deckId: string) => Deck | undefined;
  repository: StudyRepository;
  deckStore: DeckStoreApi;
  settingsStore: SettingsStoreApi;
  clock: () => number;
  random: RandomSource;
  createId: () => string;
}

export type DeckStartRequest =
  | { mode: "learn"; sectionId: number }
  | { mode: "review" }
  | { mode: "custom"; itemIds: readonly string[] };

export type DeckStartResult = { ok: true } | { ok: false; reason: "unknown-deck" | "locked" | "no-cards" };

export interface DeckRateOutcome {
  sessionCompleted: boolean;
  summary: DeckSessionSummary | null;
  newlyUnlocked: number[];
}

export function createDeckController(deps: DeckControllerDeps) {
  const { getDeck, repository, deckStore, settingsStore, clock, random, createId } = deps;

  const stateOf = (deckId: string) => deckStore.getState().decks[deckId] ?? IDLE_DECK;

  function commit(deckId: string, progress: DeckProgress) {
    deckStore.getState().updateDeck(deckId, { progress });
    repository.saveDeckProgress(deckId, progress).catch(() => {});
  }

  function finish(deckId: string, progress: DeckProgress, summary: DeckSessionSummary | null): DeckProgress {
    deckStore.getState().updateDeck(deckId, { lastSummary: summary });
    return {
      ...progress,
      activeSession: null,
      sessionHistory: summary
        ? [...progress.sessionHistory, summary].slice(-DECK_RULES.maxSessionHistory)
        : progress.sessionHistory,
    };
  }

  /** Drops the current round so the next one uses new options; answers already given keep their effect. */
  function withoutSession(deckId: string, progress: DeckProgress): DeckProgress {
    deckStore.getState().updateDeck(deckId, { lastSummary: null });
    return { ...progress, activeSession: null };
  }

  const api = {
    /** Loads a deck's saved progress once; unreadable data is backed up and replaced. */
    async hydrate(deckId: string): Promise<void> {
      const deck = getDeck(deckId);
      if (!deck || stateOf(deckId).status !== "idle") return;
      deckStore.getState().updateDeck(deckId, { status: "loading" });
      const result = await repository.loadDeckProgress(deckId);
      const progress =
        result.status === "loaded"
          ? normalizeDeckProgress(deck, result.value)
          : createInitialDeckProgress(deck, clock());
      if (result.status === "corrupt") await repository.saveDeckProgress(deckId, progress);
      deckStore.getState().updateDeck(deckId, { status: "ready", progress });
    },

    startSession(deckId: string, request: DeckStartRequest): DeckStartResult {
      const deck = getDeck(deckId);
      const { progress } = stateOf(deckId);
      if (!deck || !progress) return { ok: false, reason: "unknown-deck" };
      const base = { progress, size: settingsStore.getState().settings.sessionSize, now: clock(), random };

      let queue;
      let sectionId: number | null = null;
      if (request.mode === "learn") {
        const section = findSection(deck, request.sectionId);
        if (!section) return { ok: false, reason: "unknown-deck" };
        if (!progress.unlockedSectionIds.includes(section.id)) return { ok: false, reason: "locked" };
        queue = buildDeckQueue({ ...base, itemIds: section.itemIds });
        sectionId = section.id;
      } else if (request.mode === "review") {
        queue = buildDeckReviewQueue(deck, { ...base, unlockedSectionIds: progress.unlockedSectionIds });
      } else {
        const known = new Set(deck.items.map((item) => item.id));
        queue = buildDeckQueue({ ...base, itemIds: request.itemIds.filter((id) => known.has(id)) });
      }
      if (queue.length === 0) return { ok: false, reason: "no-cards" };

      const session = createSession<(typeof queue)[number], DeckSessionMode>({
        id: createId(),
        mode: request.mode,
        sectionId,
        queue,
        now: clock(),
      });
      deckStore.getState().updateDeck(deckId, { lastSummary: null });
      commit(deckId, { ...progress, activeSession: session, updatedAt: clock() });
      return { ok: true };
    },

    /** Starts a round over the learner's chosen range. */
    startRound(deckId: string): DeckStartResult {
      const deck = getDeck(deckId);
      const { progress } = stateOf(deckId);
      if (!deck || !progress) return { ok: false, reason: "unknown-deck" };
      return api.startSession(deckId, { mode: "custom", itemIds: rangeItemIds(deck, progress.range) });
    },

    setRange(deckId: string, range: DeckRange | null): void {
      const deck = getDeck(deckId);
      const { progress } = stateOf(deckId);
      if (!deck || !progress) return;
      commit(deckId, { ...withoutSession(deckId, progress), range: normalizeDeckRange(deck, range), updatedAt: clock() });
    },

    reveal(deckId: string): void {
      const { progress } = stateOf(deckId);
      if (!progress?.activeSession) return;
      const session = revealCurrentCard(progress.activeSession);
      if (session !== progress.activeSession) {
        deckStore.getState().updateDeck(deckId, { progress: { ...progress, activeSession: session } });
      }
    },

    rate(deckId: string, rating: RecallRating): DeckRateOutcome | null {
      const deck = getDeck(deckId);
      const { progress } = stateOf(deckId);
      const session = progress?.activeSession;
      const cardId = session ? currentCardId(session) : null;
      if (!deck || !progress || !session || !cardId) return null;
      const now = clock();

      let next = applyDeckReview(progress, cardId, rating, now);
      let nextSession = answerCurrentCard(session, rating, now);
      let newlyUnlocked: number[] = [];
      if (isSuccessfulRecall(rating)) {
        const unlocks = resolveDeckUnlocks(deck, next);
        if (unlocks.newlyUnlocked.length > 0) {
          next = { ...next, unlockedSectionIds: unlocks.unlockedSectionIds };
          nextSession = recordUnlocks(nextSession, unlocks.newlyUnlocked);
          newlyUnlocked = unlocks.newlyUnlocked;
        }
      }

      let summary: DeckSessionSummary | null = null;
      if (nextSession.completedAt !== null) {
        summary = summarizeSession(nextSession);
        next = finish(deckId, next, summary);
      } else {
        next = { ...next, activeSession: nextSession };
      }
      commit(deckId, next);
      return { sessionCompleted: summary !== null, summary, newlyUnlocked };
    },

    endSession(deckId: string): void {
      const { progress } = stateOf(deckId);
      const session = progress?.activeSession;
      if (!progress || !session) return;
      const summary = session.answers.length > 0 ? summarizeSession({ ...session, completedAt: clock() }) : null;
      commit(deckId, { ...finish(deckId, progress, summary), updatedAt: clock() });
    },

    dismissSummary(deckId: string): void {
      deckStore.getState().updateDeck(deckId, { lastSummary: null });
    },

    /** Changes which card types are studied, then re-checks unlocks against the new set. */
    setPrompts(deckId: string, promptIds: readonly string[]): void {
      const deck = getDeck(deckId);
      const { progress } = stateOf(deckId);
      if (!deck || !progress || promptIds.length === 0) return;
      const valid = deck.prompts.map((p) => p.id).filter((id) => promptIds.includes(id));
      const updated = { ...withoutSession(deckId, progress), promptIds: valid };
      const unlocks = resolveDeckUnlocks(deck, updated);
      commit(deckId, { ...updated, unlockedSectionIds: unlocks.unlockedSectionIds, updatedAt: clock() });
    },

    async reset(deckId: string): Promise<void> {
      const deck = getDeck(deckId);
      if (!deck) return;
      await repository.clearDeckProgress(deckId);
      deckStore.getState().updateDeck(deckId, { progress: createInitialDeckProgress(deck, clock()), lastSummary: null });
    },
  };
  return api;
}
