import { createStore } from "zustand/vanilla";
import { createInitialProgress } from "@/domain/study/progress.service";
import type { ProgressRecord, SessionSummary } from "@/domain/study/types";

export type HydrationStatus = "idle" | "loading" | "ready";

export interface StudyNotice {
  kind: "recovered" | "migrated" | "persist-failed";
  message: string;
}

export interface StudyStoreState {
  status: HydrationStatus;
  progress: ProgressRecord;
  /** Summary of the session that just finished, shown until dismissed. */
  lastSummary: SessionSummary | null;
  notice: StudyNotice | null;
}

export interface StudyStoreActions {
  setStatus(status: HydrationStatus): void;
  setProgress(progress: ProgressRecord): void;
  setLastSummary(summary: SessionSummary | null): void;
  setNotice(notice: StudyNotice | null): void;
}

export type StudyStore = StudyStoreState & StudyStoreActions;

/** Deterministic initial state so server and first client render match. */
export function initialStudyState(): StudyStoreState {
  return { status: "idle", progress: createInitialProgress(0), lastSummary: null, notice: null };
}

export function createStudyStore(initial: Partial<StudyStoreState> = {}) {
  return createStore<StudyStore>()((set) => ({
    ...initialStudyState(),
    ...initial,
    setStatus: (status) => set({ status }),
    setProgress: (progress) => set({ progress }),
    setLastSummary: (lastSummary) => set({ lastSummary }),
    setNotice: (notice) => set({ notice }),
  }));
}

export type StudyStoreApi = ReturnType<typeof createStudyStore>;

export const studyStore = createStudyStore();
