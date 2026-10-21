import { createStore } from "zustand/vanilla";
import { DEFAULT_SETTINGS } from "@/domain/study/settings.service";
import type { StudySettings } from "@/domain/study/types";

export interface SettingsStoreState {
  settings: StudySettings;
}

export interface SettingsStoreActions {
  setSettings(settings: StudySettings): void;
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

export function createSettingsStore(initial: StudySettings = DEFAULT_SETTINGS) {
  return createStore<SettingsStore>()((set) => ({
    settings: { ...initial, cardKinds: [...initial.cardKinds] },
    setSettings: (settings) => set({ settings }),
  }));
}

export type SettingsStoreApi = ReturnType<typeof createSettingsStore>;

export const settingsStore = createSettingsStore();
