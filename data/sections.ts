export interface SectionConfig {
  /** Elements per section, taken in atomic-number order. */
  size: number;
  /** Consecutive successful recalls before a card counts as mastered. */
  masteryStreak: number;
  /** Fraction of a section's cards that must be mastered to unlock the next section. */
  unlockThreshold: number;
  /** Short themes shown under each section title, keyed by section id. */
  subtitles: Readonly<Record<number, string>>;
}

export const SECTION_CONFIG: SectionConfig = {
  size: 10,
  masteryStreak: 3,
  unlockThreshold: 0.8,
  subtitles: {
    1: "The first two periods",
    2: "Period 3 and the start of period 4",
    3: "The first transition series",
    4: "Closing period 4, opening period 5",
    5: "The second transition series",
    6: "Heavy p-block into the lanthanides",
    7: "Deep in the lanthanides",
    8: "Third transition series and mercury",
    9: "Heavy metals, radon, and early actinides",
    10: "The actinide series",
    11: "First superheavy elements",
    12: "The end of the table",
  },
};
