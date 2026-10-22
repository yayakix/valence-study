"use client";

import { useState } from "react";
import { catalog } from "@/controllers";
import {
  advanceNumberDrill,
  createNumberDrill,
  currentNumber,
  revealNumber,
  type NumberDrill,
} from "@/domain/study/number-drill.service";

const NUMBERS = catalog.elements.map((element) => element.atomicNumber);

/** Big-number practice: guess the element from its atomic number alone. */
export function useNumberDrill() {
  const [drill, setDrill] = useState<NumberDrill | null>(null);
  const number = drill ? currentNumber(drill) : null;

  return {
    drill,
    element: number === null ? null : (catalog.elements.find((e) => e.atomicNumber === number) ?? null),
    total: NUMBERS.length,
    /** Shuffles on first use only, so switching modes keeps your place. */
    start: () => {
      if (!drill) setDrill(createNumberDrill(NUMBERS, Math.random));
    },
    reveal: () => drill && setDrill(revealNumber(drill)),
    next: () => drill && setDrill(advanceNumberDrill(drill, Math.random)),
  };
}
