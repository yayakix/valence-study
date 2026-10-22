import { shuffle, type RandomSource } from "@/domain/shared/random";

/** A shuffled pass through atomic numbers: every number appears once before any repeats. */
export interface NumberDrill {
  deck: number[];
  index: number;
  revealed: boolean;
  round: number;
}

export function createNumberDrill(numbers: readonly number[], random: RandomSource): NumberDrill {
  if (numbers.length === 0) throw new Error("A number drill needs at least one number");
  return { deck: shuffle(numbers, random), index: 0, revealed: false, round: 1 };
}

export function currentNumber(drill: NumberDrill): number {
  return drill.deck[drill.index]!;
}

export function revealNumber(drill: NumberDrill): NumberDrill {
  return drill.revealed ? drill : { ...drill, revealed: true };
}

/** Moves to the next number, reshuffling for a new round at the end without repeating the last number first. */
export function advanceNumberDrill(drill: NumberDrill, random: RandomSource): NumberDrill {
  if (drill.index + 1 < drill.deck.length) {
    return { ...drill, index: drill.index + 1, revealed: false };
  }
  const last = currentNumber(drill);
  let deck = shuffle(drill.deck, random);
  if (deck.length > 1 && deck[0] === last) deck = [...deck.slice(1), last];
  return { deck, index: 0, revealed: false, round: drill.round + 1 };
}
