"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Eye } from "lucide-react";
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

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <RangePicker min={min} max={max} onChange={setRange} />
      <div className="text-center text-xs text-muted-foreground tabular-nums" data-testid="drill-position">
        {drill.index + 1} of {drill.deck.length}
        {drill.round > 1 && ` · round ${drill.round}`}
      </div>

      <div
        aria-live="polite"
        className="flex h-80 flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-6 text-center shadow-sm"
      >
        <div className="font-mono text-8xl font-semibold tabular-nums sm:text-9xl" data-testid="drill-number">
          {element.atomicNumber}
        </div>
        {revealed ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid size-12 place-items-center rounded-lg border font-mono text-xl font-semibold",
                CATEGORY_STYLES[element.category].tile,
              )}
            >
              {element.symbol}
            </div>
            <div className="text-left">
              <div className="text-2xl font-semibold" data-testid="drill-answer">
                {element.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {getCategory(element.category).label} ·{" "}
                <span className="whitespace-nowrap">{formatAtomicMass(element)} u</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Which element has this atomic number?</p>
        )}
      </div>

      {revealed ? (
        <Button size="lg" className="h-12 text-base" onClick={next}>
          Next number <ArrowRight data-icon="inline-end" />
        </Button>
      ) : (
        <Button size="lg" className="h-12 text-base" onClick={reveal}>
          <Eye data-icon="inline-start" /> Reveal
        </Button>
      )}
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
      className="h-8 w-16 rounded-md border bg-background px-2 text-center font-medium tabular-nums focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    />
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
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
                "h-8 rounded-md border px-2 text-xs tabular-nums transition-colors hover:bg-muted",
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
