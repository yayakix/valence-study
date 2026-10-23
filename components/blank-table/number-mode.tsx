"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Eye, SlidersHorizontal } from "lucide-react";
import { CATEGORY_STYLES } from "@/components/periodic-table/category-styles";
import { Button } from "@/components/ui/button";
import { getCategory } from "@/data";
import { formatAtomicMass } from "@/domain/elements/queries";
import { DRILL_RANGE_LIMITS, normalizeDrillRange } from "@/domain/study/settings.service";
import type { useNumberDrill } from "@/hooks/useNumberDrill";
import { cn } from "@/lib/utils";

export function NumberMode({
  drill: { drill, element, min, max, setRange, reveal, next },
}: {
  drill: ReturnType<typeof useNumberDrill>;
}) {
  const revealed = drill?.revealed ?? false;
  const [rangeOpen, setRangeOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") return;
      if (event.target instanceof HTMLElement && event.target.closest("button, input, textarea")) return;
      event.preventDefault();
      if (revealed) next();
      else reveal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!drill || !element) return null;

  const advance = revealed ? next : reveal;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 sm:flex-none sm:gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground tabular-nums" data-testid="drill-position">
          {drill.index + 1} of {drill.deck.length}
          {drill.round > 1 && ` · round ${drill.round}`}
        </span>
        <button
          type="button"
          aria-expanded={rangeOpen}
          aria-controls="drill-range"
          onClick={() => setRangeOpen((open) => !open)}
          className="flex h-9 touch-manipulation items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium tabular-nums transition-colors hover:bg-muted"
        >
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <span className="sr-only">Change range, currently </span>
          {min}–{max}
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", rangeOpen && "rotate-180")} />
        </button>
      </div>

      {rangeOpen && (
        <div id="drill-range" className="rounded-xl border bg-card p-3">
          <RangePicker min={min} max={max} onChange={setRange} />
        </div>
      )}

      <div
        aria-live="polite"
        onClick={advance}
        data-testid="drill-card"
        className="flex min-h-64 flex-1 cursor-pointer touch-manipulation flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-4 text-center shadow-sm select-none sm:h-80 sm:flex-none sm:p-6"
      >
        <div
          className="font-mono text-[clamp(5.5rem,32vw,9rem)] leading-none font-semibold tabular-nums"
          data-testid="drill-number"
        >
          {element.atomicNumber}
        </div>
        <div className="flex min-h-16 items-center justify-center">
          {revealed ? (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid size-14 shrink-0 place-items-center rounded-lg border font-mono text-2xl font-semibold",
                  CATEGORY_STYLES[element.category].tile,
                )}
              >
                {element.symbol}
              </div>
              <div className="min-w-0 text-left">
                <div className="text-2xl leading-tight font-semibold sm:text-3xl" data-testid="drill-answer">
                  {element.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getCategory(element.category).label} ·{" "}
                  <span className="whitespace-nowrap">{formatAtomicMass(element)} u</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Which element is this? <span className="sm:hidden">Tap to reveal.</span>
            </p>
          )}
        </div>
      </div>

      <Button size="lg" className="h-14 touch-manipulation text-base sm:h-12" onClick={advance}>
        {revealed ? (
          <>
            Next number <ArrowRight data-icon="inline-end" />
          </>
        ) : (
          <>
            <Eye data-icon="inline-start" /> Reveal
          </>
        )}
      </Button>
      <p className="hidden text-center text-xs text-muted-foreground sm:block">Space reveals, then moves to the next number</p>
    </div>
  );
}

const PRESETS = [
  { label: "1–10", from: 1, to: 10 },
  { label: "1–20", from: 1, to: 20 },
  { label: "1–36", from: 1, to: 36 },
  { label: "All", from: DRILL_RANGE_LIMITS.lowest, to: DRILL_RANGE_LIMITS.highest },
] as const;

function RangePicker({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (from: number, to: number) => void;
}) {
  const [draft, setDraft] = useState({ from: String(min), to: String(max) });

  const apply = (from: number, to: number) => {
    const range = normalizeDrillRange(from, to);
    setDraft({ from: String(range.drillMinNumber), to: String(range.drillMaxNumber) });
    if (range.drillMinNumber !== min || range.drillMaxNumber !== max) onChange(from, to);
  };

  const commit = () => {
    const from = Number(draft.from);
    const to = Number(draft.to);
    if (!Number.isInteger(from) || !Number.isInteger(to)) setDraft({ from: String(min), to: String(max) });
    else apply(from, to);
  };

  const numberInput = (field: "from" | "to", label: string) => (
    <input
      type="number"
      inputMode="numeric"
      min={DRILL_RANGE_LIMITS.lowest}
      max={DRILL_RANGE_LIMITS.highest}
      value={draft[field]}
      onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      aria-label={label}
      className="h-10 w-16 rounded-md border bg-background px-2 text-center text-base font-medium tabular-nums focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    />
  );

  return (
    <div className="flex flex-col items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Numbers</span>
        {numberInput("from", "Lowest atomic number to practice")}
        <span className="text-muted-foreground">to</span>
        {numberInput("to", "Highest atomic number to practice")}
      </div>
      <div className="flex gap-1">
        {PRESETS.map((preset) => {
          const active = preset.from === min && preset.to === max;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={active}
              onClick={() => apply(preset.from, preset.to)}
              className={cn(
                "h-10 touch-manipulation rounded-md border px-3 text-sm tabular-nums transition-colors hover:bg-muted",
                active && "border-primary bg-accent font-medium",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
