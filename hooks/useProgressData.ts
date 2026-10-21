"use client";

import { useStore } from "zustand";
import { progressController } from "@/controllers";
import { settingsStore } from "@/stores/settings.store";
import { studyStore } from "@/stores/study.store";

/** Import/export, reset, settings, and storage notices. */
export function useProgressData() {
  const settings = useStore(settingsStore, (s) => s.settings);
  const notice = useStore(studyStore, (s) => s.notice);
  return {
    settings,
    notice,
    exportProgress: progressController.exportProgress,
    importProgress: progressController.importProgress,
    resetProgress: progressController.resetProgress,
    updateSettings: progressController.updateSettings,
    dismissNotice: progressController.dismissNotice,
  };
}
