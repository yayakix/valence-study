import { CARD_KINDS, type StudySettings } from "./types";

export const SESSION_SIZE_LIMITS = { min: 5, max: 50 } as const;
export const DRILL_RANGE_LIMITS = { lowest: 1, highest: 118 } as const;

export const DEFAULT_SETTINGS: StudySettings = {
  sessionSize: 20,
  cardKinds: ["symbol-to-name", "name-to-symbol"],
  drillMinNumber: DRILL_RANGE_LIMITS.lowest,
  drillMaxNumber: DRILL_RANGE_LIMITS.highest,
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, Math.round(value)));

/** Orders the bounds and keeps at least two numbers in range so the drill can move on. */
export function normalizeDrillRange(min: number, max: number): { drillMinNumber: number; drillMaxNumber: number } {
  const { lowest, highest } = DRILL_RANGE_LIMITS;
  let low = clamp(Math.min(min, max), lowest, highest);
  let high = clamp(Math.max(min, max), lowest, highest);
  if (low === high) {
    if (high < highest) high++;
    else low--;
  }
  return { drillMinNumber: low, drillMaxNumber: high };
}

export function normalizeSettings(settings: Partial<StudySettings>): StudySettings {
  const size = Math.round(settings.sessionSize ?? DEFAULT_SETTINGS.sessionSize);
  const kinds = CARD_KINDS.filter((kind) => settings.cardKinds?.includes(kind));
  return {
    sessionSize: Math.min(SESSION_SIZE_LIMITS.max, Math.max(SESSION_SIZE_LIMITS.min, size)),
    cardKinds: kinds.length > 0 ? kinds : [...DEFAULT_SETTINGS.cardKinds],
    ...normalizeDrillRange(
      settings.drillMinNumber ?? DEFAULT_SETTINGS.drillMinNumber,
      settings.drillMaxNumber ?? DEFAULT_SETTINGS.drillMaxNumber,
    ),
  };
}
