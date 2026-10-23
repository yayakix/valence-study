import { describe, expect, it } from "vitest";
import { createDeckController } from "@/controllers/deck.controller";
import { DECKS, getDeck } from "@/data/decks";
import { NATO_DECK } from "@/data/decks/nato";
import { buildDeckCard, deckCardId, deckSections, parseDeckCardId, validateDeck } from "@/domain/decks/deck.service";
import {
  applyDeckReview,
  buildDeckQueue,
  createInitialDeckProgress,
  normalizeDeckProgress,
  normalizeDeckRange,
  rangeItemIds,
  rangeLabel,
  resolveDeckUnlocks,
} from "@/domain/decks/deck-study.service";
import type { DeckProgress } from "@/domain/decks/types";
import { seededRandom } from "@/domain/shared/random";
import { decodeDeckProgress, encodeDeckProgress } from "@/lib/persistence/codec";
import { createLocalStorageRepository, createMemoryStorage, storageKeys } from "@/lib/persistence/local-storage.adapter";
import { createDeckStore } from "@/stores/deck.store";
import { createSettingsStore } from "@/stores/settings.store";
import { T0, flush } from "../helpers";

function masterItems(progress: DeckProgress, itemIds: string[]): DeckProgress {
  let next = progress;
  for (const itemId of itemIds) {
    for (const promptId of next.promptIds) {
      for (let i = 0; i < 3; i++) next = applyDeckReview(next, deckCardId(itemId, promptId), "good", T0 + i);
    }
  }
  return next;
}

describe("built-in decks", () => {
  it.each(DECKS.map((deck) => [deck.id, deck] as const))("%s is valid", (_id, deck) => {
    expect(validateDeck(deck)).toEqual([]);
  });

  it("looks decks up by id", () => {
    expect(getDeck("nato-alphabet")).toBe(NATO_DECK);
    expect(getDeck("nope")).toBeUndefined();
  });
});

describe("deck structure", () => {
  it("splits the NATO alphabet into sections of ten named by letter", () => {
    expect(deckSections(NATO_DECK).map((s) => [s.title, s.itemIds.length])).toEqual([
      ["A–J", 10],
      ["K–T", 10],
      ["U–Z", 6],
    ]);
  });

  it("round-trips card ids and builds both card directions", () => {
    const id = deckCardId("j", "letter-to-word");
    expect(parseDeckCardId(id)).toEqual({ itemId: "j", promptId: "letter-to-word" });
    expect(buildDeckCard(NATO_DECK, id)).toMatchObject({ front: "J", answer: "Juliett", detail: "JEW-lee-ett" });
    expect(buildDeckCard(NATO_DECK, deckCardId("x", "word-to-letter"))).toMatchObject({ front: "X-ray", answer: "X" });
    expect(buildDeckCard(NATO_DECK, deckCardId("x", "missing"))).toBeNull();
  });

  it("reports broken decks", () => {
    const broken = { ...NATO_DECK, items: [...NATO_DECK.items, { id: "a", fields: { letter: "A" } }] };
    expect(validateDeck(broken)).toEqual(expect.arrayContaining(['Duplicate item id "a"', 'Item "a" is missing "word"']));
  });
});

describe("deck study rules", () => {
  it("queues only the chosen items and card types", () => {
    const progress = { ...createInitialDeckProgress(NATO_DECK, T0), promptIds: ["letter-to-word"] };
    const queue = buildDeckQueue({ progress, itemIds: ["a", "q", "z"], size: 20, now: T0, random: seededRandom(1) });
    expect([...queue].sort()).toEqual(["a:letter-to-word", "q:letter-to-word", "z:letter-to-word"]);
  });

  it("unlocks the next section once 80% of the current one is mastered", () => {
    const base = createInitialDeckProgress(NATO_DECK, T0);
    const sectionOne = deckSections(NATO_DECK)[0]!.itemIds;
    expect(resolveDeckUnlocks(NATO_DECK, masterItems(base, sectionOne.slice(0, 7))).newlyUnlocked).toEqual([]);
    expect(resolveDeckUnlocks(NATO_DECK, masterItems(base, sectionOne.slice(0, 8))).newlyUnlocked).toEqual([2]);
  });

  it("drops stale prompts and sections and keeps section 1 open", () => {
    const stale = { ...createInitialDeckProgress(NATO_DECK, T0), promptIds: ["gone"], unlockedSectionIds: [2, 9] };
    const normalized = normalizeDeckProgress(NATO_DECK, stale);
    expect(normalized.promptIds).toEqual(["letter-to-word", "word-to-letter"]);
    expect(normalized.unlockedSectionIds).toEqual([1, 2]);
  });
});

describe("deck ranges", () => {
  it("orders and clamps ranges, treating the whole deck as no range", () => {
    expect(normalizeDeckRange(NATO_DECK, { start: 14, end: 10 })).toEqual({ start: 10, end: 14 });
    expect(normalizeDeckRange(NATO_DECK, { start: -3, end: 99 })).toBeNull();
    expect(rangeItemIds(NATO_DECK, { start: 10, end: 14 })).toEqual(["k", "l", "m", "n", "o"]);
  });

  it("labels ranges by the deck's section field", () => {
    expect(rangeLabel(NATO_DECK, null)).toBe("All 26 letters");
    expect(rangeLabel(NATO_DECK, { start: 10, end: 14 })).toBe("K–O");
    expect(rangeLabel(NATO_DECK, { start: 2, end: 2 })).toBe("C");
  });
});

describe("deck persistence", () => {
  it("round-trips progress and rejects bad data", () => {
    const progress = masterItems(createInitialDeckProgress(NATO_DECK, T0), ["a"]);
    expect(decodeDeckProgress(encodeDeckProgress(progress))).toEqual(progress);
    expect(() => decodeDeckProgress('{"schemaVersion":1,"data":{}}')).toThrow(/recognized format/);
    expect(() => decodeDeckProgress('{"schemaVersion":99,"data":{}}')).toThrow(/newer/);
  });
});

describe("deck controller", () => {
  function harness(storage = createMemoryStorage()) {
    let id = 0;
    const deps = {
      getDeck,
      repository: createLocalStorageRepository(storage, { now: () => T0 }),
      deckStore: createDeckStore(),
      settingsStore: createSettingsStore(),
      clock: () => T0,
      random: seededRandom(7),
      createId: () => `deck-session-${++id}`,
    };
    return { deps, storage, deck: createDeckController(deps), state: () => deps.deckStore.getState().decks["nato-alphabet"]! };
  }

  function finish(h: ReturnType<typeof harness>) {
    while (h.state().progress?.activeSession) {
      h.deck.reveal("nato-alphabet");
      h.deck.rate("nato-alphabet", "good");
    }
  }

  it("learns section 1 to mastery, unlocks section 2, and saves under its own key", async () => {
    const h = harness();
    await h.deck.hydrate("nato-alphabet");
    expect(h.deck.startSession("nato-alphabet", { mode: "learn", sectionId: 2 })).toEqual({ ok: false, reason: "locked" });

    for (let round = 0; round < 3; round++) {
      expect(h.deck.startSession("nato-alphabet", { mode: "learn", sectionId: 1 })).toEqual({ ok: true });
      finish(h);
    }
    expect(h.state().progress!.unlockedSectionIds).toEqual([1, 2]);
    expect(h.state().lastSummary?.unlockedSectionIds).toEqual([2]);

    await flush();
    const saved = h.storage.getItem(storageKeys().deck("nato-alphabet"));
    expect(saved && decodeDeckProgress(saved).unlockedSectionIds).toEqual([1, 2]);
    expect(h.storage.getItem(storageKeys().progress)).toBeNull();
  });

  it("practices a custom set, including locked items", async () => {
    const h = harness();
    await h.deck.hydrate("nato-alphabet");
    expect(h.deck.startSession("nato-alphabet", { mode: "custom", itemIds: ["x", "y", "z"] })).toEqual({ ok: true });
    expect(h.state().progress!.activeSession!.queue).toHaveLength(6);
    expect(h.deck.startSession("nato-alphabet", { mode: "custom", itemIds: [] })).toEqual({ ok: false, reason: "no-cards" });
  });

  it("practices rounds over the chosen range, restarting the round when it changes", async () => {
    const h = harness();
    await h.deck.hydrate("nato-alphabet");
    expect(h.deck.startRound("nato-alphabet")).toEqual({ ok: true });
    expect(h.state().progress!.activeSession!.queue).toHaveLength(20);

    h.deck.setRange("nato-alphabet", { start: 10, end: 11 });
    expect(h.state().progress!.activeSession).toBeNull();
    h.deck.startRound("nato-alphabet");
    expect([...h.state().progress!.activeSession!.queue].sort()).toEqual([
      "k:letter-to-word",
      "k:word-to-letter",
      "l:letter-to-word",
      "l:word-to-letter",
    ]);

    await flush();
    const restored = harness(h.storage);
    await restored.deck.hydrate("nato-alphabet");
    expect(restored.state().progress!.range).toEqual({ start: 10, end: 11 });
  });

  it("restores saved progress and recovers from corrupt data", async () => {
    const first = harness();
    await first.deck.hydrate("nato-alphabet");
    first.deck.setPrompts("nato-alphabet", ["word-to-letter"]);
    await flush();

    const restored = harness(first.storage);
    await restored.deck.hydrate("nato-alphabet");
    expect(restored.state().progress!.promptIds).toEqual(["word-to-letter"]);

    const corrupt = createMemoryStorage({ [storageKeys().deck("nato-alphabet")]: "not json" });
    const recovered = harness(corrupt);
    await recovered.deck.hydrate("nato-alphabet");
    expect(recovered.state().status).toBe("ready");
    expect(Object.keys(corrupt.snapshot()).some((key) => key.includes("corrupt"))).toBe(true);
  });
});
