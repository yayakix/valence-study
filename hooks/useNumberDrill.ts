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

const numbersBetween = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

const matchesRange = (drill: NumberDrill, min: number, max: number) =>
  drill.deck.length === max - min + 1 && drill.deck.every((n) => n >= min && n <= max);

/** Big-number practice: guess the element from its atomic number alone, within a chosen range. */
export function useNumberDrill() {
  const min = useStore(settingsStore, (s) => s.settings.drillMinNumber);
  const max = useStore(settingsStore, (s) => s.settings.drillMaxNumber);
  const [drill, setDrill] = useState<NumberDrill | null>(null);
  const number = drill ? currentNumber(drill) : null;

  return {
    drill,
    element: number === null ? null : (catalog.elements.find((e) => e.atomicNumber === number) ?? null),
    min,
    max,
    /** Shuffles on first use only, so switching modes keeps your place. */
    start: () => {
      if (!drill || !matchesRange(drill, min, max)) setDrill(createNumberDrill(numbersBetween(min, max), Math.random));
    },
    reveal: () => drill && setDrill(revealNumber(drill)),
    next: () => drill && setDrill(advanceNumberDrill(drill, Math.random)),
    /** Saves the new range and starts a fresh shuffle within it. */
    setRange: async (from: number, to: number) => {
      const settings = await progressController.updateSettings({ drillMinNumber: from, drillMaxNumber: to });
      setDrill(createNumberDrill(numbersBetween(settings.drillMinNumber, settings.drillMaxNumber), Math.random));
    },
  };
}
