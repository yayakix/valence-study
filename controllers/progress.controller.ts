import { createInitialProgress, normalizeProgress } from "@/domain/study/progress.service";
import { resolveUnlocks } from "@/domain/study/section-unlock.service";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/domain/study/settings.service";
import type { StudySettings } from "@/domain/study/types";
import { createExportBundle, parseImport } from "@/lib/persistence/codec";
import { PersistenceError } from "@/lib/persistence/migrations";
import type { ControllerDeps } from "./types";

export type ImportResult =
  | { ok: true; migratedFrom: number | null; cardsImported: number }
  | { ok: false; error: string };

export function createProgressController(deps: ControllerDeps) {
  const { catalog, repository, studyStore, settingsStore, clock } = deps;

  return {
    /** Loads persisted state into the stores. Safe to call repeatedly; only the first call loads. */
    async hydrate(): Promise<void> {
      if (studyStore.getState().status !== "idle") return;
      studyStore.getState().setStatus("loading");

      const [progressResult, settingsResult] = await Promise.all([
        repository.loadProgress(),
        repository.loadSettings(),
      ]);

      const settings = settingsResult.status === "loaded" ? settingsResult.value : { ...DEFAULT_SETTINGS };
      settingsStore.getState().setSettings(settings);

      if (progressResult.status === "loaded") {
        const progress = normalizeProgress(progressResult.value, catalog);
        studyStore.getState().setProgress(progress);
        if (progressResult.migratedFrom !== null) {
          await repository.saveProgress(progress);
          studyStore.getState().setNotice({
            kind: "migrated",
            message: `Your progress was upgraded from an older format (v${progressResult.migratedFrom}).`,
          });
        }
      } else {
        const progress = createInitialProgress(clock());
        studyStore.getState().setProgress(progress);
        if (progressResult.status === "corrupt") {
          await repository.saveProgress(progress);
          studyStore.getState().setNotice({
            kind: "recovered",
            message: `Saved progress couldn't be read (${progressResult.reason}). A backup was kept and you're starting fresh.`,
          });
        }
      }
      studyStore.getState().setStatus("ready");
    },

    exportProgress(): string {
      return createExportBundle(studyStore.getState().progress, settingsStore.getState().settings, clock());
    },

    async importProgress(raw: string): Promise<ImportResult> {
      try {
        const imported = parseImport(raw);
        const progress = normalizeProgress(imported.progress, catalog);
        await repository.saveProgress(progress);
        studyStore.getState().setProgress(progress);
        studyStore.getState().setLastSummary(null);
        if (imported.settings) {
          await repository.saveSettings(imported.settings);
          settingsStore.getState().setSettings(imported.settings);
        }
        return { ok: true, migratedFrom: imported.migratedFrom, cardsImported: Object.keys(progress.cards).length };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof PersistenceError ? error.message : "That file couldn't be imported.",
        };
      }
    },

    async resetProgress(): Promise<void> {
      const progress = createInitialProgress(clock());
      await repository.saveProgress(progress);
      studyStore.getState().setProgress(progress);
      studyStore.getState().setLastSummary(null);
    },

    async updateSettings(patch: Partial<StudySettings>): Promise<StudySettings> {
      const settings = normalizeSettings({ ...settingsStore.getState().settings, ...patch });
      settingsStore.getState().setSettings(settings);
      await repository.saveSettings(settings);

      const { progress } = studyStore.getState();
      const unlocks = resolveUnlocks(catalog, progress, settings.cardKinds);
      if (unlocks.newlyUnlocked.length > 0) {
        const next = { ...progress, unlockedSectionIds: unlocks.unlockedSectionIds, updatedAt: clock() };
        studyStore.getState().setProgress(next);
        await repository.saveProgress(next);
      }
      return settings;
    },

    dismissNotice(): void {
      studyStore.getState().setNotice(null);
    },
  };
}

export type ProgressController = ReturnType<typeof createProgressController>;
