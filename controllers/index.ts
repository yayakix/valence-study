import { DEFAULT_CATALOG } from "@/data";
import { getDeck } from "@/data/decks";
import { createBrowserRepository } from "@/lib/persistence/local-storage.adapter";
import type { StudyRepository } from "@/lib/persistence/repository";
import { deckStore } from "@/stores/deck.store";
import { settingsStore } from "@/stores/settings.store";
import { studyStore } from "@/stores/study.store";
import { createDeckController } from "./deck.controller";
import { createProgressController } from "./progress.controller";
import { createStudyController } from "./study.controller";
import type { ControllerDeps } from "./types";

/** Defers touching browser storage until the first call, which only happens client-side. */
function lazyRepository(factory: () => StudyRepository): StudyRepository {
  let instance: StudyRepository | null = null;
  const get = () => (instance ??= factory());
  return {
    loadProgress: () => get().loadProgress(),
    saveProgress: (progress) => get().saveProgress(progress),
    loadSettings: () => get().loadSettings(),
    saveSettings: (settings) => get().saveSettings(settings),
    loadDeckProgress: (deckId) => get().loadDeckProgress(deckId),
    saveDeckProgress: (deckId, progress) => get().saveDeckProgress(deckId, progress),
    clearDeckProgress: (deckId) => get().clearDeckProgress(deckId),
    clear: () => get().clear(),
  };
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const deps: ControllerDeps = {
  catalog: DEFAULT_CATALOG,
  repository: lazyRepository(() => createBrowserRepository()),
  studyStore,
  settingsStore,
  clock: () => Date.now(),
  random: Math.random,
  createId,
};

export const studyController = createStudyController(deps);
export const progressController = createProgressController(deps);
export const deckController = createDeckController({ ...deps, getDeck, deckStore });
export { DEFAULT_CATALOG as catalog };
