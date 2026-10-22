import { describe, expect, it } from "vitest";
import { currentCardId } from "@/domain/study/session.service";
import { DAY_MS } from "@/domain/study/spaced-repetition.service";
import type { RecallRating } from "@/domain/study/types";
import { createExportBundle } from "@/lib/persistence/codec";
import { storageKeys } from "@/lib/persistence/local-storage.adapter";
import { createMemoryStorage } from "@/lib/persistence/local-storage.adapter";
import { T0, createTestHarness, flush, progressWithMastered } from "../helpers";

const keys = storageKeys();

function finishSession(h: ReturnType<typeof createTestHarness>, rating: RecallRating = "good") {
  let last = null;
  while (h.deps.studyStore.getState().progress.activeSession) {
    h.study.revealCard();
    last = h.study.rateCard(rating);
  }
  return last;
}

describe("study workflow", () => {
  it("hydrates a fresh learner with defaults", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    const state = h.deps.studyStore.getState();
    expect(state.status).toBe("ready");
    expect(state.progress.unlockedSectionIds).toEqual([1]);
    expect(state.notice).toBeNull();
  });

  it("refuses locked or unknown sections", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    expect(h.study.startSession("learn", 2)).toEqual({ ok: false, reason: "locked" });
    expect(h.study.startSession("learn", 99)).toEqual({ ok: false, reason: "unknown-section" });
    expect(h.study.startSession("review")).toEqual({ ok: false, reason: "no-cards" });
  });

  it("rating a card records history, reschedules, advances the session, and persists", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    const started = h.study.startSession("learn", 1);
    expect(started.ok).toBe(true);
    const cardId = currentCardId(h.deps.studyStore.getState().progress.activeSession!)!;

    h.study.revealCard();
    expect(h.deps.studyStore.getState().progress.activeSession!.revealed).toBe(true);
    const outcome = h.study.rateCard("good");
    await flush();

    expect(outcome).toMatchObject({ cardId, rating: "good", sessionCompleted: false, newlyUnlocked: [] });
    const { progress } = h.deps.studyStore.getState();
    expect(progress.cards[cardId]).toMatchObject({ repetitions: 1, dueAt: T0 + DAY_MS });
    expect(progress.activeSession!.position).toBe(1);
    const stored = JSON.parse(h.storage.snapshot()[keys.progress]!);
    expect(stored.data.cards[cardId].history).toHaveLength(1);
  });

  it("completes a session with a summary stored in history", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    h.study.startSession("learn", 1);
    const last = finishSession(h);
    const state = h.deps.studyStore.getState();
    expect(last?.sessionCompleted).toBe(true);
    expect(state.progress.activeSession).toBeNull();
    expect(state.progress.sessionHistory).toHaveLength(1);
    expect(state.lastSummary).toMatchObject({ mode: "learn", sectionId: 1, totalAnswers: 20, accuracy: 1 });
  });

  it("unlocks section 2 after enough sessions of successful recall", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    const unlockedAt: number[] = [];
    for (let i = 0; i < 6 && unlockedAt.length === 0; i++) {
      h.study.startSession("learn", 1);
      while (h.deps.studyStore.getState().progress.activeSession) {
        const outcome = h.study.rateCard("good");
        unlockedAt.push(...(outcome?.newlyUnlocked.map((s) => s.id) ?? []));
      }
      h.advance(60_000);
    }
    expect(unlockedAt).toEqual([2]);
    const { progress } = h.deps.studyStore.getState();
    expect(progress.unlockedSectionIds).toEqual([1, 2]);
    expect(progress.sessionHistory.some((s) => s.unlockedSectionIds.includes(2))).toBe(true);
    expect(h.study.startSession("learn", 2).ok).toBe(true);
  });

  it("does not recalculate unlocks on a miss", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    h.study.startSession("learn", 1);
    expect(h.study.rateCard("again")?.newlyUnlocked).toEqual([]);
  });

  it("builds spaced reviews from cards that have come due", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    h.study.startSession("learn", 1);
    finishSession(h);
    h.advance(2 * DAY_MS);
    const review = h.study.startSession("review");
    expect(review.ok && review.session.queue.length).toBe(20);
  });

  it("builds cumulative reviews across unlocked sections", async () => {
    const h = createTestHarness();
    const seeded = { ...progressWithMastered([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ["symbol-to-name", "name-to-symbol"]), unlockedSectionIds: [1, 2] };
    h.storage.setItem(keys.progress, JSON.stringify({ schemaVersion: 2, data: seeded }));
    await h.progress.hydrate();
    const result = h.study.startSession("cumulative");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sections = new Set(result.session.queue.map((id) => (Number(id.split(":")[0]) <= 10 ? 1 : 2)));
    expect(sections).toEqual(new Set([1, 2]));
  });

  it("resumes an in-progress session after reload", async () => {
    const storage = createMemoryStorage();
    const first = createTestHarness({ storage });
    await first.progress.hydrate();
    first.study.startSession("learn", 1);
    first.study.rateCard("good");
    await flush();

    const second = createTestHarness({ storage });
    await second.progress.hydrate();
    expect(second.deps.studyStore.getState().progress.activeSession?.position).toBe(1);
  });

  it("ending early keeps answers and records a partial summary", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    h.study.startSession("learn", 1);
    h.study.rateCard("good");
    const summary = h.study.endSession();
    expect(summary?.totalAnswers).toBe(1);
    expect(h.deps.studyStore.getState().progress.activeSession).toBeNull();
    expect(Object.keys(h.deps.studyStore.getState().progress.cards)).toHaveLength(1);
  });
});

describe("progress workflows", () => {
  it("recovers from corrupt storage with a notice and a backup", async () => {
    const storage = createMemoryStorage({ [keys.progress]: '{"schemaVersion":2,"data":{"cards":5}}' });
    const h = createTestHarness({ storage });
    await h.progress.hydrate();
    const state = h.deps.studyStore.getState();
    expect(state.status).toBe("ready");
    expect(state.notice?.kind).toBe("recovered");
    expect(state.progress.unlockedSectionIds).toEqual([1]);
    expect(Object.keys(storage.snapshot()).some((k) => k.includes("corrupt-"))).toBe(true);
    expect(JSON.parse(storage.snapshot()[keys.progress]!).schemaVersion).toBe(2);
  });

  it("migrates legacy storage on load and saves the upgraded record", async () => {
    const storage = createMemoryStorage({
      [keys.progress]: JSON.stringify({ schemaVersion: 1, highestSection: 3, savedAt: T0, reviews: {} }),
    });
    const h = createTestHarness({ storage });
    await h.progress.hydrate();
    expect(h.deps.studyStore.getState().notice?.kind).toBe("migrated");
    expect(h.deps.studyStore.getState().progress.unlockedSectionIds).toEqual([1, 2, 3]);
    expect(JSON.parse(storage.snapshot()[keys.progress]!).schemaVersion).toBe(2);
  });

  it("hydrates only once", async () => {
    const h = createTestHarness();
    await Promise.all([h.progress.hydrate(), h.progress.hydrate()]);
    h.study.startSession("learn", 1);
    await h.progress.hydrate();
    expect(h.deps.studyStore.getState().progress.activeSession).not.toBeNull();
  });

  it("imports an export bundle and rejects invalid files without losing data", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    const seeded = { ...progressWithMastered([1, 2], ["symbol-to-name"]), unlockedSectionIds: [1, 2] };
    const bundle = createExportBundle(seeded, { sessionSize: 10, cardKinds: ["symbol-to-name"], drillMaxNumber: 118 }, T0);

    expect(await h.progress.importProgress(bundle)).toEqual({ ok: true, migratedFrom: null, cardsImported: 2 });
    expect(h.deps.settingsStore.getState().settings.sessionSize).toBe(10);
    expect(h.deps.studyStore.getState().progress.unlockedSectionIds).toEqual([1, 2]);

    const bad = await h.progress.importProgress("not json");
    expect(bad.ok).toBe(false);
    expect(h.deps.studyStore.getState().progress.unlockedSectionIds).toEqual([1, 2]);
  });

  it("exports the current state", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    const bundle = JSON.parse(h.progress.exportProgress());
    expect(bundle).toMatchObject({ format: "valence-progress", progress: { schemaVersion: 2 }, settings: { schemaVersion: 1 } });
  });

  it("updates settings and unlocks if the new card kinds already meet mastery", async () => {
    const h = createTestHarness();
    const seeded = progressWithMastered([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ["symbol-to-name"]);
    h.storage.setItem(keys.progress, JSON.stringify({ schemaVersion: 2, data: seeded }));
    await h.progress.hydrate();
    expect(h.deps.studyStore.getState().progress.unlockedSectionIds).toEqual([1]);
    const settings = await h.progress.updateSettings({ cardKinds: ["symbol-to-name"], sessionSize: 999 });
    expect(settings.sessionSize).toBe(50);
    expect(h.deps.studyStore.getState().progress.unlockedSectionIds).toEqual([1, 2]);
  });

  it("resets progress", async () => {
    const h = createTestHarness();
    await h.progress.hydrate();
    h.study.startSession("learn", 1);
    finishSession(h);
    await h.progress.resetProgress();
    const { progress, lastSummary } = h.deps.studyStore.getState();
    expect(progress.sessionHistory).toEqual([]);
    expect(progress.cards).toEqual({});
    expect(lastSummary).toBeNull();
  });
});
