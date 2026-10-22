"use client";

import { useCallback, useMemo, useState } from "react";
import { catalog } from "@/controllers";

/** One-at-a-time reveal: showing an element hides whichever was showing before. */
export function useBlankTable() {
  const [revealedNumber, setRevealedNumber] = useState<number | null>(null);

  const revealed = useMemo(
    () => catalog.elements.find((element) => element.atomicNumber === revealedNumber) ?? null,
    [revealedNumber],
  );

  const toggle = useCallback(
    (atomicNumber: number) => setRevealedNumber((current) => (current === atomicNumber ? null : atomicNumber)),
    [],
  );
  const hide = useCallback(() => setRevealedNumber(null), []);

  return { elements: catalog.elements, revealed, toggle, hide };
}
