"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Eye } from "lucide-react";
import { CATEGORY_STYLES } from "@/components/periodic-table/category-styles";
import { Button } from "@/components/ui/button";
import { getCategory } from "@/data";
import { formatAtomicMass } from "@/domain/elements/queries";
import { DRILL_MAX_LIMITS } from "@/domain/study/settings.service";
import type { useNumberDrill } from "@/hooks/useNumberDrill";
import { cn } from "@/lib/utils";

export function NumberMode({
  drill: { drill, element, max, setMax, reveal, next },
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
      <RangePicker key={max} max={max} onChange={setMax} />
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

const PRESETS = [10, 20, 36, 54, 118] as const;

function RangePicker({ max, onChange }: { max: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(max));

  const commit = () => {
    const value = Number(draft);
    if (!Number.isInteger(value) || value === max) {
      setDraft(String(max));
      return;
    }
    const clamped = Math.min(DRILL_MAX_LIMITS.max, Math.max(DRILL_MAX_LIMITS.min, value));
    setDraft(String(clamped));
    onChange(clamped);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
      <label className="flex items-center gap-2">
        <span className="text-muted-foreground">Numbers 1 to</span>
        <input
          type="number"
          inputMode="numeric"
          min={DRILL_MAX_LIMITS.min}
          max={DRILL_MAX_LIMITS.max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Highest atomic number to practice"
          className="h-8 w-16 rounded-md border bg-background px-2 text-center font-medium tabular-nums focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        />
      </label>
      <div className="flex gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={max === preset}
            onClick={() => preset !== max && onChange(preset)}
            className={cn(
              "h-8 rounded-md border px-2 text-xs tabular-nums transition-colors hover:bg-muted",
              max === preset && "border-primary bg-accent font-medium",
            )}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
