"use client";

import { useState } from "react";
import { useStore } from "zustand";
import { catalog, progressController } from "@/controllers";
import {
  advanceNumberDrill,
  createNumberDrill,
  currentNumber,
  revealNumber,
  type NumberDrill,
} from "@/domain/study/number-drill.service";
import { settingsStore } from "@/stores/settings.store";

const numbersUpTo = (max: number) => Array.from({ length: max }, (_, i) => i + 1);

/** Big-number practice: guess the element from its atomic number alone, from 1 up to a chosen limit. */
export function useNumberDrill() {
  const max = useStore(settingsStore, (s) => s.settings.drillMaxNumber);
  const [drill, setDrill] = useState<NumberDrill | null>(null);
  const number = drill ? currentNumber(drill) : null;

  return {
    drill,
    element: number === null ? null : (catalog.elements.find((e) => e.atomicNumber === number) ?? null),
    max,
    /** Shuffles on first use only, so switching modes keeps your place. */
    start: () => {
      if (!drill || drill.deck.length !== max) setDrill(createNumberDrill(numbersUpTo(max), Math.random));
    },
    reveal: () => drill && setDrill(revealNumber(drill)),
    next: () => drill && setDrill(advanceNumberDrill(drill, Math.random)),
    /** Saves the new limit and starts a fresh shuffle within it. */
    setMax: async (value: number) => {
      const settings = await progressController.updateSettings({ drillMaxNumber: value });
      setDrill(createNumberDrill(numbersUpTo(settings.drillMaxNumber), Math.random));
    },
  };
}
