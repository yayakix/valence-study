import { DEFAULT_CATALOG } from "@/data";
import { createProgressController } from "@/controllers/progress.controller";
import { createStudyController } from "@/controllers/study.controller";
import type { ControllerDeps } from "@/controllers/types";
import { seededRandom } from "@/domain/shared/random";
import { toCardId } from "@/domain/study/flashcard.service";
import { createInitialProgress } from "@/domain/study/progress.service";
import { scheduleReview } from "@/domain/study/spaced-repetition.service";
import type { CardKind, CardReviewState, ProgressRecord, RecallRating } from "@/domain/study/types";
import { createLocalStorageRepository, createMemoryStorage } from "@/lib/persistence/local-storage.adapter";
import { createSettingsStore } from "@/stores/settings.store";
import { createStudyStore } from "@/stores/study.store";

export const catalog = DEFAULT_CATALOG;
export const T0 = new Date(2026, 0, 15, 9, 0, 0).getTime();

/** Builds a card state by replaying ratings, so tests read like a review history. */
export function reviewed(atomicNumber: number, kind: CardKind, ratings: RecallRating[], at = T0): CardReviewState {
  const id = toCardId(atomicNumber, kind);
  let state: CardReviewState | undefined;
  ratings.forEach((rating, i) => {
    state = scheduleReview(state, id, rating, at + i * 1000);
  });
  if (!state) throw new Error("reviewed() needs at least one rating");
  return state;
}

/** Progress where the given elements have every listed card kind mastered. */
export function progressWithMastered(
  atomicNumbers: number[],
  kinds: CardKind[],
  base: ProgressRecord = createInitialProgress(T0),
): ProgressRecord {
  const cards = { ...base.cards };
  for (const n of atomicNumbers) {
    for (const kind of kinds) cards[toCardId(n, kind)] = reviewed(n, kind, ["good", "good", "good"]);
  }
  return { ...base, cards };
}

export function createTestHarness(options: { storage?: ReturnType<typeof createMemoryStorage>; now?: number } = {}) {
  const storage = options.storage ?? createMemoryStorage();
  let now = options.now ?? T0;
  let idCounter = 0;
  const deps: ControllerDeps = {
    catalog,
    repository: createLocalStorageRepository(storage, { now: () => now }),
    studyStore: createStudyStore(),
    settingsStore: createSettingsStore(),
    clock: () => now,
    random: seededRandom(42),
    createId: () => `session-${++idCounter}`,
  };
  return {
    deps,
    storage,
    study: createStudyController(deps),
    progress: createProgressController(deps),
    advance(ms: number) {
      now += ms;
    },
    get now() {
      return now;
    },
  };
}

/** Lets fire-and-forget saves settle. */
export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
