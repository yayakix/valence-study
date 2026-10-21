import { describe, expect, it } from "vitest";
import { createInitialProgress, normalizeProgress } from "@/domain/study/progress.service";
import { createSession } from "@/domain/study/session.service";
import { DEFAULT_SETTINGS } from "@/domain/study/settings.service";
import type { ProgressRecord } from "@/domain/study/types";
import {
  createExportBundle,
  decodeProgress,
  decodeSettings,
  encodeProgress,
  encodeSettings,
  parseImport,
} from "@/lib/persistence/codec";
import {
  createLocalStorageRepository,
  createMemoryStorage,
  storageKeys,
} from "@/lib/persistence/local-storage.adapter";
import { PersistenceError, migrateProgressEnvelope } from "@/lib/persistence/migrations";
import { CURRENT_PROGRESS_VERSION } from "@/lib/persistence/progress-schema";
import { T0, catalog, progressWithMastered } from "../helpers";

const keys = storageKeys();

function sampleProgress(): ProgressRecord {
  const progress = progressWithMastered([1, 2, 3], ["symbol-to-name"]);
  return {
    ...progress,
    activeSession: createSession({ id: "s1", mode: "learn", sectionId: 1, queue: ["4:symbol-to-name"], now: T0 }),
  };
}

const v1Envelope = {
  schemaVersion: 1,
  highestSection: 2,
  savedAt: T0,
  reviews: {
    "1:symbol-to-name": { ease: 2.6, interval: 6, reps: 2, due: T0 + 6 * 86_400_000 },
    "2:name-to-symbol": { ease: 9, interval: 1, reps: 1, due: T0 },
    "not-a-card": { ease: 2.5, interval: 1, reps: 1, due: T0 },
  },
};

describe("progress codec and schema", () => {
  it("round-trips progress with review history intact", () => {
    const progress = sampleProgress();
    const { progress: decoded, migratedFrom } = decodeProgress(encodeProgress(progress));
    expect(decoded).toEqual(progress);
    expect(migratedFrom).toBeNull();
    expect(decoded.cards["1:symbol-to-name"]!.history).toHaveLength(3);
  });

  it("writes the current schema version", () => {
    expect(JSON.parse(encodeProgress(createInitialProgress(T0))).schemaVersion).toBe(CURRENT_PROGRESS_VERSION);
  });

  it.each([
    ["not JSON", "{oops", "invalid-json"],
    ["no version", JSON.stringify({ data: {} }), "invalid-data"],
    ["future version", JSON.stringify({ schemaVersion: 99, data: {} }), "unsupported-version"],
    ["bad card", JSON.stringify({ schemaVersion: 2, data: { ...createInitialProgress(T0), cards: { "1:symbol-to-name": { cardId: "1:symbol-to-name" } } } }), "invalid-data"],
    ["mismatched key", JSON.stringify({ schemaVersion: 2, data: { ...sampleProgress(), cards: { "9:symbol-to-name": sampleProgress().cards["1:symbol-to-name"] } } }), "invalid-data"],
    ["no unlocked sections", JSON.stringify({ schemaVersion: 2, data: { ...createInitialProgress(T0), unlockedSectionIds: [] } }), "invalid-data"],
  ])("rejects %s", (_label, raw, reason) => {
    try {
      decodeProgress(raw);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).reason).toBe(reason);
    }
  });
});

describe("migrations", () => {
  it("upgrades v1 data to the current schema", () => {
    const { progress, migratedFrom } = migrateProgressEnvelope(v1Envelope);
    expect(migratedFrom).toBe(1);
    expect(progress.unlockedSectionIds).toEqual([1, 2]);
    expect(Object.keys(progress.cards).sort()).toEqual(["1:symbol-to-name", "2:name-to-symbol"]);
    expect(progress.cards["1:symbol-to-name"]).toMatchObject({ easeFactor: 2.6, intervalDays: 6, repetitions: 2, lapses: 0, history: [] });
    expect(progress.cards["2:name-to-symbol"]!.easeFactor).toBe(5);
    expect(progress.activeSession).toBeNull();
  });

  it("reports malformed legacy data as invalid", () => {
    expect(() => migrateProgressEnvelope({ schemaVersion: 1, reviews: "nope" })).toThrow(PersistenceError);
  });
});

describe("normalizeProgress", () => {
  it("drops unknown cards, invalid sessions, and bad section ids", () => {
    const progress = sampleProgress();
    const dirty: ProgressRecord = {
      ...progress,
      cards: { ...progress.cards, "200:symbol-to-name": { ...progress.cards["1:symbol-to-name"]!, cardId: "200:symbol-to-name" } },
      unlockedSectionIds: [3, 40],
      activeSession: { ...progress.activeSession!, queue: ["150:symbol-to-name"] },
    };
    const clean = normalizeProgress(dirty, catalog);
    expect(clean.cards["200:symbol-to-name"]).toBeUndefined();
    expect(clean.unlockedSectionIds).toEqual([1, 3]);
    expect(clean.activeSession).toBeNull();
  });

  it("keeps a valid in-progress session", () => {
    expect(normalizeProgress(sampleProgress(), catalog).activeSession?.id).toBe("s1");
  });
});

describe("settings codec", () => {
  it("round-trips settings", () => {
    const settings = { sessionSize: 30, cardKinds: ["number-to-element" as const] };
    expect(decodeSettings(encodeSettings(settings))).toEqual(settings);
  });

  it("repairs invalid fields instead of failing", () => {
    expect(decodeSettings(JSON.stringify({ schemaVersion: 1, data: { sessionSize: 500, cardKinds: ["bogus"] } }))).toEqual({
      sessionSize: 50,
      cardKinds: DEFAULT_SETTINGS.cardKinds,
    });
    expect(decodeSettings(JSON.stringify("garbage"))).toEqual(DEFAULT_SETTINGS);
  });
});

describe("import and export", () => {
  it("exports a bundle that imports back identically", () => {
    const progress = sampleProgress();
    const settings = { sessionSize: 10, cardKinds: ["symbol-to-name" as const] };
    const imported = parseImport(createExportBundle(progress, settings, T0));
    expect(imported).toEqual({ progress, settings, migratedFrom: null });
  });

  it("accepts a bare legacy envelope", () => {
    const imported = parseImport(JSON.stringify(v1Envelope));
    expect(imported.migratedFrom).toBe(1);
    expect(imported.settings).toBeNull();
  });

  it("rejects unrelated JSON", () => {
    expect(() => parseImport(JSON.stringify({ hello: "world" }))).toThrow(PersistenceError);
  });
});

describe("local storage repository", () => {
  it("returns empty when nothing is stored, then loads what was saved", async () => {
    const repo = createLocalStorageRepository(createMemoryStorage());
    expect(await repo.loadProgress()).toEqual({ status: "empty" });
    const progress = sampleProgress();
    await repo.saveProgress(progress);
    expect(await repo.loadProgress()).toEqual({ status: "loaded", value: progress, migratedFrom: null });
  });

  it("backs up corrupt data instead of throwing", async () => {
    const storage = createMemoryStorage({ [keys.progress]: "{corrupt" });
    const repo = createLocalStorageRepository(storage, { now: () => 123 });
    const result = await repo.loadProgress();
    expect(result).toMatchObject({ status: "corrupt", backupKey: keys.backup("progress", 123) });
    expect(storage.snapshot()[keys.backup("progress", 123)]).toBe("{corrupt");
  });

  it("reports migrated loads", async () => {
    const storage = createMemoryStorage({ [keys.progress]: JSON.stringify(v1Envelope) });
    const result = await createLocalStorageRepository(storage).loadProgress();
    expect(result).toMatchObject({ status: "loaded", migratedFrom: 1 });
  });

  it("namespaces data by profile and clears it", async () => {
    const storage = createMemoryStorage();
    const a = createLocalStorageRepository(storage, { profile: "a" });
    const b = createLocalStorageRepository(storage, { profile: "b" });
    await a.saveProgress(sampleProgress());
    expect((await b.loadProgress()).status).toBe("empty");
    await a.saveSettings(DEFAULT_SETTINGS);
    await a.clear();
    expect(storage.snapshot()).toEqual({});
  });
});
