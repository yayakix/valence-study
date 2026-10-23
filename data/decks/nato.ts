import type { Deck } from "@/domain/decks/types";

/** ICAO spelling alphabet, with the official spellings ("Alfa", "Juliett") and pronunciations. */
const WORDS: readonly [string, string][] = [
  ["Alfa", "AL-fah"],
  ["Bravo", "BRAH-voh"],
  ["Charlie", "CHAR-lee"],
  ["Delta", "DELL-tah"],
  ["Echo", "ECK-oh"],
  ["Foxtrot", "FOKS-trot"],
  ["Golf", "golf"],
  ["Hotel", "hoh-TELL"],
  ["India", "IN-dee-ah"],
  ["Juliett", "JEW-lee-ett"],
  ["Kilo", "KEY-loh"],
  ["Lima", "LEE-mah"],
  ["Mike", "mike"],
  ["November", "no-VEM-ber"],
  ["Oscar", "OSS-cah"],
  ["Papa", "pah-PAH"],
  ["Quebec", "keh-BECK"],
  ["Romeo", "ROW-me-oh"],
  ["Sierra", "see-AIR-rah"],
  ["Tango", "TANG-go"],
  ["Uniform", "YOU-nee-form"],
  ["Victor", "VIK-tah"],
  ["Whiskey", "WISS-key"],
  ["X-ray", "ECKS-ray"],
  ["Yankee", "YANG-key"],
  ["Zulu", "ZOO-loo"],
];

export const NATO_DECK: Deck = {
  id: "nato-alphabet",
  title: "NATO phonetic alphabet",
  shortTitle: "NATO alphabet",
  itemNoun: "letters",
  description: "The spelling alphabet used by pilots, the military, and call centers: A is Alfa, B is Bravo, and so on.",
  fields: [
    { id: "letter", label: "Letter" },
    { id: "word", label: "Code word" },
    { id: "pronunciation", label: "Pronunciation" },
  ],
  prompts: [
    { id: "letter-to-word", from: "letter", to: "word", label: "Letter → code word", question: "Code word for" },
    { id: "word-to-letter", from: "word", to: "letter", label: "Code word → letter", question: "Letter for" },
  ],
  sectionLabelField: "letter",
  detailField: "pronunciation",
  sectionSize: 10,
  items: WORDS.map(([word, pronunciation], index) => {
    const letter = String.fromCharCode(65 + index);
    return { id: letter.toLowerCase(), fields: { letter, word, pronunciation } };
  }),
};
