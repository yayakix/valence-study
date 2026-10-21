import type { CardReviewState, ProgressRecord } from "@/domain/study/types";
import {
  CURRENT_PROGRESS_VERSION,
  cardIdSchema,
  progressEnvelopeV1Schema,
  progressEnvelopeV2Schema,
  versionProbeSchema,
} from "./progress-schema";

export class PersistenceError extends Error {
  constructor(
    message: string,
    readonly reason: "invalid-json" | "unsupported-version" | "invalid-data",
  ) {
    super(message);
    this.name = "PersistenceError";
  }
}

type Migration = (input: unknown) => unknown;

/** Each entry upgrades an envelope from version `key` to `key + 1`. */
export const PROGRESS_MIGRATIONS: Readonly<Record<number, Migration>> = {
  1: (input) => {
    const v1 = progressEnvelopeV1Schema.parse(input);
    const cards: ProgressRecord["cards"] = {};
    for (const [key, review] of Object.entries(v1.reviews)) {
      const parsedId = cardIdSchema.safeParse(key);
      if (!parsedId.success) continue;
      const state: CardReviewState = {
        cardId: parsedId.data,
        easeFactor: Math.min(5, Math.max(1.3, review.ease)),
        intervalDays: review.interval,
        repetitions: review.reps,
        lapses: 0,
        dueAt: review.due,
        lastReviewedAt: review.reps > 0 ? Math.max(0, review.due - review.interval * 86_400_000) : null,
        history: [],
      };
      cards[parsedId.data] = state;
    }
    const record: ProgressRecord = {
      cards,
      unlockedSectionIds: Array.from({ length: v1.highestSection }, (_, i) => i + 1),
      activeSession: null,
      sessionHistory: [],
      updatedAt: v1.savedAt,
    };
    return { schemaVersion: 2, data: record };
  },
};

export interface MigrationResult {
  progress: ProgressRecord;
  migratedFrom: number | null;
}

/** Upgrades any known envelope version to the current one and validates it. */
export function migrateProgressEnvelope(input: unknown): MigrationResult {
  const probe = versionProbeSchema.safeParse(input);
  if (!probe.success) throw new PersistenceError("Progress data has no schema version", "invalid-data");
  const startVersion = probe.data.schemaVersion;
  if (startVersion > CURRENT_PROGRESS_VERSION) {
    throw new PersistenceError(
      `Progress was saved by a newer version of the app (schema v${startVersion})`,
      "unsupported-version",
    );
  }

  let current: unknown = input;
  for (let version = startVersion; version < CURRENT_PROGRESS_VERSION; version++) {
    const migrate = PROGRESS_MIGRATIONS[version];
    if (!migrate) throw new PersistenceError(`No migration from schema v${version}`, "unsupported-version");
    try {
      current = migrate(current);
    } catch {
      throw new PersistenceError(`Progress data is not valid schema v${version}`, "invalid-data");
    }
  }

  const parsed = progressEnvelopeV2Schema.safeParse(current);
  if (!parsed.success) {
    throw new PersistenceError(
      `Progress data failed validation: ${parsed.error.issues[0]?.message ?? "unknown issue"}`,
      "invalid-data",
    );
  }
  return { progress: parsed.data.data, migratedFrom: startVersion === CURRENT_PROGRESS_VERSION ? null : startVersion };
}
