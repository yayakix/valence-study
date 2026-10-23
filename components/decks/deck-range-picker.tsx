"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeckRange } from "@/domain/decks/types";
import type { useDeck } from "@/hooks/useDeck";
import { cn } from "@/lib/utils";

type DeckApi = ReturnType<typeof useDeck>;

const chip =
  "flex h-9 touch-manipulation items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted";
const chipOn = "border-primary bg-primary text-primary-foreground hover:bg-primary/90";

export function DeckRangePicker({ api, onDone }: { api: DeckApi; onDone: () => void }) {
  const { deck, sections, range, progress } = api;
  if (!progress) return null;
  const last = deck.items.length - 1;
  const start = range?.start ?? 0;
  const end = range?.end ?? last;
  const label = (index: number) => deck.items[index]!.fields[deck.sectionLabelField];
  const same = (a: DeckRange | null, b: DeckRange | null) => a?.start === b?.start && a?.end === b?.end;

  const togglePrompt = (id: string) => {
    const on = progress.promptIds.includes(id);
    if (on && progress.promptIds.length === 1) return;
    api.setPrompts(on ? progress.promptIds.filter((p) => p !== id) : [...progress.promptIds, id]);
  };

  return (
    <div id="deck-range" className="space-y-4 rounded-xl border bg-card p-3 sm:p-4">
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Practice</div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={range === null} onClick={() => api.setRange(null)} className={cn(chip, range === null && chipOn)}>
            All
          </button>
          {sections.map((section) => {
            const on = same(range, section.range);
            return (
              <button
                key={section.id}
                type="button"
                aria-pressed={on}
                onClick={() => api.setRange(section.range)}
                className={cn(chip, on && chipOn)}
              >
                {section.title}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="sr-only" htmlFor="range-from">
            From
          </label>
          <select
            id="range-from"
            value={start}
            onChange={(event) => api.setRange({ start: Number(event.target.value), end })}
            className="h-9 rounded-lg border bg-background px-2 text-base sm:text-sm"
          >
            {deck.items.map((item, index) => (
              <option key={item.id} value={index}>
                {label(index)}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">to</span>
          <label className="sr-only" htmlFor="range-to">
            To
          </label>
          <select
            id="range-to"
            value={end}
            onChange={(event) => api.setRange({ start, end: Number(event.target.value) })}
            className="h-9 rounded-lg border bg-background px-2 text-base sm:text-sm"
          >
            {deck.items.map((item, index) => (
              <option key={item.id} value={index}>
                {label(index)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Cards</div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Card types">
          {deck.prompts.map((prompt) => {
            const on = progress.promptIds.includes(prompt.id);
            return (
              <button
                key={prompt.id}
                type="button"
                aria-pressed={on}
                onClick={() => togglePrompt(prompt.id)}
                className={cn(chip, on && "border-primary/40 bg-accent")}
              >
                {on && <Check className="size-3.5" />}
                {prompt.label}
              </button>
            );
          })}
        </div>
      </div>

      <Button className="w-full" variant="secondary" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
