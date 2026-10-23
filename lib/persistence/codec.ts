import type { DeckProgress } from "@/domain/decks/types";
import type { ProgressRecord, StudySettings } from "@/domain/study/types";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/domain/study/settings.service";
import { CURRENT_DECK_PROGRESS_VERSION, deckProgressEnvelopeSchema } from "./deck-schema";
import { migrateProgressEnvelope, PersistenceError, type MigrationResult } from "./migrations";
import {
  CURRENT_PROGRESS_VERSION,
  CURRENT_SETTINGS_VERSION,
  EXPORT_FORMAT,
  exportBundleSchema,
  settingsEnvelopeSchema,
  settingsSchema,
} from "./progress-schema";

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new PersistenceError("Data is not valid JSON", "invalid-json");
  }
}

export function encodeProgress(progress: ProgressRecord): string {
  return JSON.stringify({ schemaVersion: CURRENT_PROGRESS_VERSION, data: progress });
}

export function decodeProgress(raw: string): MigrationResult {
  return migrateProgressEnvelope(parseJson(raw));
}

export function encodeDeckProgress(progress: DeckProgress): string {
  return JSON.stringify({ schemaVersion: CURRENT_DECK_PROGRESS_VERSION, data: progress });
}

export function decodeDeckProgress(raw: string): DeckProgress {
  const json = parseJson(raw);
  const version = typeof json === "object" && json !== null ? (json as { schemaVersion?: unknown }).schemaVersion : undefined;
  if (typeof version === "number" && version > CURRENT_DECK_PROGRESS_VERSION) {
    throw new PersistenceError(`Topic progress version ${version} is newer than this app supports`, "unsupported-version");
  }
  const parsed = deckProgressEnvelopeSchema.safeParse(json);
  if (!parsed.success) throw new PersistenceError("Topic progress is not in a recognized format", "invalid-data");
  return parsed.data.data;
}

export function encodeSettings(settings: StudySettings): string {
  return JSON.stringify({ schemaVersion: CURRENT_SETTINGS_VERSION, data: settings });
}

/** Settings are low-stakes: invalid fields fall back to defaults instead of failing. */
export function decodeSettingsValue(value: unknown): StudySettings {
  const envelope = settingsEnvelopeSchema.safeParse(value);
  if (envelope.success) return envelope.data.data;
  const data =
    typeof value === "object" && value !== null && "data" in value ? (value as { data: unknown }).data : value;
  const partial = settingsSchema.safeParse(data);
  if (partial.success) return partial.data;
  if (typeof data === "object" && data !== null) {
    const candidate = data as Partial<Record<keyof StudySettings, unknown>>;
    return normalizeSettings({
      sessionSize: typeof candidate.sessionSize === "number" ? candidate.sessionSize : undefined,
      cardKinds: Array.isArray(candidate.cardKinds) ? (candidate.cardKinds as StudySettings["cardKinds"]) : undefined,
      drillMinNumber: typeof candidate.drillMinNumber === "number" ? candidate.drillMinNumber : undefined,
      drillMaxNumber: typeof candidate.drillMaxNumber === "number" ? candidate.drillMaxNumber : undefined,
    });
  }
  return { ...DEFAULT_SETTINGS };
}

export function decodeSettings(raw: string): StudySettings {
  return decodeSettingsValue(parseJson(raw));
}

export interface ExportBundle {
  format: typeof EXPORT_FORMAT;
  exportedAt: number;
  progress: { schemaVersion: number; data: ProgressRecord };
  settings: { schemaVersion: number; data: StudySettings };
}

export function createExportBundle(progress: ProgressRecord, settings: StudySettings, now: number): string {
  const bundle: ExportBundle = {
    format: EXPORT_FORMAT,
    exportedAt: now,
    progress: { schemaVersion: CURRENT_PROGRESS_VERSION, data: progress },
    settings: { schemaVersion: CURRENT_SETTINGS_VERSION, data: settings },
  };
  return JSON.stringify(bundle, null, 2);
}

export interface ImportedData {
  progress: ProgressRecord;
  settings: StudySettings | null;
  migratedFrom: number | null;
}

/** Accepts a full export bundle or a bare progress envelope. */
export function parseImport(raw: string): ImportedData {
  const json = parseJson(raw);
  const bundle = exportBundleSchema.safeParse(json);
  if (bundle.success) {
    const { progress, migratedFrom } = migrateProgressEnvelope(bundle.data.progress);
    const settings = bundle.data.settings === undefined ? null : decodeSettingsValue(bundle.data.settings);
    return { progress, settings, migratedFrom };
  }
  const { progress, migratedFrom } = migrateProgressEnvelope(json);
  return { progress, settings: null, migratedFrom };
}
