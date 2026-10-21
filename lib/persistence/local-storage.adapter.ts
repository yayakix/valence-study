import type { ProgressRecord, StudySettings } from "@/domain/study/types";
import { decodeProgress, decodeSettings, encodeProgress, encodeSettings } from "./codec";
import { PersistenceError } from "./migrations";
import type { LoadResult, StudyRepository } from "./repository";

/** The subset of the Web Storage API the adapter needs; lets tests pass a fake. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface LocalStorageRepositoryOptions {
  /** Profile namespace, so multiple study profiles can share one browser later. */
  profile?: string;
  now?: () => number;
}

export function storageKeys(profile = "default") {
  const prefix = `valence:${profile}`;
  return {
    progress: `${prefix}:progress`,
    settings: `${prefix}:settings`,
    backup: (kind: string, at: number) => `${prefix}:${kind}:corrupt-${at}`,
  };
}

export function createLocalStorageRepository(
  storage: KeyValueStorage,
  options: LocalStorageRepositoryOptions = {},
): StudyRepository {
  const keys = storageKeys(options.profile);
  const now = options.now ?? Date.now;

  function backup(kind: string, raw: string): string | null {
    const key = keys.backup(kind, now());
    try {
      storage.setItem(key, raw);
      return key;
    } catch {
      return null;
    }
  }

  function load<T>(
    key: string,
    kind: string,
    decode: (raw: string) => { value: T; migratedFrom: number | null },
  ): LoadResult<T> {
    const raw = storage.getItem(key);
    if (raw === null) return { status: "empty" };
    try {
      return { status: "loaded", ...decode(raw) };
    } catch (error) {
      const reason = error instanceof PersistenceError ? error.message : "Stored data could not be read";
      return { status: "corrupt", reason, backupKey: backup(kind, raw) };
    }
  }

  return {
    async loadProgress() {
      return load<ProgressRecord>(keys.progress, "progress", (raw) => {
        const { progress, migratedFrom } = decodeProgress(raw);
        return { value: progress, migratedFrom };
      });
    },
    async loadSettings() {
      return load<StudySettings>(keys.settings, "settings", (raw) => ({
        value: decodeSettings(raw),
        migratedFrom: null,
      }));
    },
    async saveProgress(progress) {
      storage.setItem(keys.progress, encodeProgress(progress));
    },
    async saveSettings(settings) {
      storage.setItem(keys.settings, encodeSettings(settings));
    },
    async clear() {
      storage.removeItem(keys.progress);
      storage.removeItem(keys.settings);
    },
  };
}

export function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  snapshot(): Record<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    snapshot: () => Object.fromEntries(data),
  };
}

/** Browser localStorage when available; an in-memory store during SSR or when storage is blocked. */
export function createBrowserRepository(options?: LocalStorageRepositoryOptions): StudyRepository {
  let storage: KeyValueStorage;
  try {
    storage = typeof window !== "undefined" && window.localStorage ? window.localStorage : createMemoryStorage();
  } catch {
    storage = createMemoryStorage();
  }
  return createLocalStorageRepository(storage, options);
}
