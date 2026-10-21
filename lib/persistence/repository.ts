import type { ProgressRecord, StudySettings } from "@/domain/study/types";

export type LoadResult<T> =
  | { status: "empty" }
  | { status: "loaded"; value: T; migratedFrom: number | null }
  /** Stored data was unreadable; it was backed up under `backupKey` and should be replaced. */
  | { status: "corrupt"; reason: string; backupKey: string | null };

/**
 * Storage boundary for the study engine. Async so a remote/database-backed
 * implementation can replace localStorage without touching callers.
 */
export interface StudyRepository {
  loadProgress(): Promise<LoadResult<ProgressRecord>>;
  saveProgress(progress: ProgressRecord): Promise<void>;
  loadSettings(): Promise<LoadResult<StudySettings>>;
  saveSettings(settings: StudySettings): Promise<void>;
  clear(): Promise<void>;
}
