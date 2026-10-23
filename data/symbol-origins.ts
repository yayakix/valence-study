/** Elements whose symbols come from a non-English name, keyed by atomic number. */
export const SYMBOL_ORIGINS: Readonly<Record<number, { word: string; language: string; meaning?: string }>> = {
  11: { word: "natrium", language: "Latin" },
  19: { word: "kalium", language: "Latin", meaning: "potash" },
  26: { word: "ferrum", language: "Latin" },
  29: { word: "cuprum", language: "Latin" },
  47: { word: "argentum", language: "Latin" },
  50: { word: "stannum", language: "Latin" },
  51: { word: "stibium", language: "Latin" },
  74: { word: "wolfram", language: "German" },
  79: { word: "aurum", language: "Latin" },
  80: { word: "hydrargyrum", language: "Latinized Greek", meaning: "water-silver" },
  82: { word: "plumbum", language: "Latin" },
};
