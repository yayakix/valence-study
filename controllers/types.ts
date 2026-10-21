import type { RandomSource } from "@/domain/shared/random";
import type { StudyCatalog } from "@/domain/study/types";
import type { StudyRepository } from "@/lib/persistence/repository";
import type { SettingsStoreApi } from "@/stores/settings.store";
import type { StudyStoreApi } from "@/stores/study.store";

export interface ControllerDeps {
  catalog: StudyCatalog;
  repository: StudyRepository;
  studyStore: StudyStoreApi;
  settingsStore: SettingsStoreApi;
  clock: () => number;
  random: RandomSource;
  createId: () => string;
}
