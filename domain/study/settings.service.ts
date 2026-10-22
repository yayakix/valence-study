import { CARD_KINDS, type StudySettings } from "./types";

export const SESSION_SIZE_LIMITS = { min: 5, max: 50 } as const;
export const DRILL_MAX_LIMITS = { min: 2, max: 118 } as const;

export const DEFAULT_SETTINGS: StudySettings = {
  sessionSize: 20,
  cardKinds: ["symbol-to-name", "name-to-symbol"],
  drillMaxNumber: DRILL_MAX_LIMITS.max,
};

export function normalizeSettings(settings: Partial<StudySettings>): StudySettings {
  const size = Math.round(settings.sessionSize ?? DEFAULT_SETTINGS.sessionSize);
  const drillMax = Math.round(settings.drillMaxNumber ?? DEFAULT_SETTINGS.drillMaxNumber);
  const kinds = CARD_KINDS.filter((kind) => settings.cardKinds?.includes(kind));
  return {
    sessionSize: Math.min(SESSION_SIZE_LIMITS.max, Math.max(SESSION_SIZE_LIMITS.min, size)),
    cardKinds: kinds.length > 0 ? kinds : [...DEFAULT_SETTINGS.cardKinds],
    drillMaxNumber: Math.min(DRILL_MAX_LIMITS.max, Math.max(DRILL_MAX_LIMITS.min, drillMax)),
  };
}
