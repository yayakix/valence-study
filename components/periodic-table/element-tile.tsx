"use client";

import { Check } from "lucide-react";
import type { TableCell } from "@/hooks/usePeriodicTable";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES } from "./category-styles";

export function ElementTile({ cell, onSelect }: { cell: TableCell; onSelect: (n: number) => void }) {
  const { element, unlocked, mastery, level, matchesFilter } = cell;
  const studiedRatio = mastery.total === 0 ? 0 : mastery.score;
  return (
    <button
      type="button"
      onClick={() => onSelect(element.atomicNumber)}
      style={{ gridRow: element.position.row, gridColumn: element.position.column }}
      aria-label={`${element.name}, ${element.symbol}, atomic number ${element.atomicNumber}${unlocked ? "" : ", locked"}`}
      data-testid={`element-${element.symbol}`}
      className={cn(
        "group relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-md border p-0.5 leading-none transition",
        "hover:z-10 hover:scale-110 hover:shadow-md focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none",
        CATEGORY_STYLES[element.category].tile,
        !unlocked && "opacity-35 saturate-50",
        !matchesFilter && "opacity-15",
      )}
    >
      <span className="absolute top-0.5 left-1 text-[8px] tabular-nums opacity-70 sm:text-[9px]">
        {element.atomicNumber}
      </span>
      {level === "mastered" && (
        <Check className="absolute top-0.5 right-0.5 size-2.5 text-primary sm:size-3" aria-hidden />
      )}
      <span className="font-mono text-sm font-semibold sm:text-base">{element.symbol}</span>
      <span className="mt-0.5 hidden w-full truncate text-center text-[8px] lg:block">{element.name}</span>
      {unlocked && level !== "new" && (
        <span aria-hidden className="absolute inset-x-1 bottom-0.5 h-0.5 overflow-hidden rounded-full bg-black/10">
          <span className="block h-full bg-primary" style={{ width: `${studiedRatio * 100}%` }} />
        </span>
      )}
    </button>
  );
}
