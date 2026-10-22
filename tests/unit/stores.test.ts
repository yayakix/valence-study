import { describe, expect, it } from "vitest";
import { createInitialProgress } from "@/domain/study/progress.service";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/domain/study/settings.service";
import { createSettingsStore } from "@/stores/settings.store";
import { createStudyStore, initialStudyState } from "@/stores/study.store";
import { T0 } from "../helpers";

describe("study store", () => {
  it("starts idle with deterministic, SSR-safe progress", () => {
    const store = createStudyStore();
    expect(store.getState()).toMatchObject(initialStudyState());
    expect(store.getState().progress.updatedAt).toBe(0);
  });

  it("applies transitions without touching unrelated state", () => {
    const store = createStudyStore();
    const progress = createInitialProgress(T0);
    store.getState().setStatus("ready");
    store.getState().setProgress(progress);
    store.getState().setNotice({ kind: "migrated", message: "hi" });
    expect(store.getState()).toMatchObject({ status: "ready", progress, notice: { kind: "migrated" }, lastSummary: null });
    store.getState().setNotice(null);
    expect(store.getState().notice).toBeNull();
  });

  it("keeps separate instances isolated", () => {
    const a = createStudyStore();
    const b = createStudyStore();
    a.getState().setStatus("ready");
    expect(b.getState().status).toBe("idle");
  });
});

describe("settings store and normalization", () => {
  it("copies initial settings so defaults are never mutated", () => {
    const store = createSettingsStore();
    store.getState().settings.cardKinds.push("number-to-element");
    expect(DEFAULT_SETTINGS.cardKinds).toHaveLength(2);
  });

  it("clamps session size and orders card kinds", () => {
    expect(normalizeSettings({ sessionSize: 2, cardKinds: ["number-to-element", "symbol-to-name"] })).toEqual({
      sessionSize: 5,
      drillMaxNumber: 118,
      cardKinds: ["symbol-to-name", "number-to-element"],
    });
    expect(normalizeSettings({ cardKinds: [] }).cardKinds).toEqual(DEFAULT_SETTINGS.cardKinds);
  });
});
