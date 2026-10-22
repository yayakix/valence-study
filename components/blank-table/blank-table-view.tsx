"use client";

import { useEffect } from "react";
import { EyeOff } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { CATEGORY_STYLES } from "@/components/periodic-table/category-styles";
import { TableGrid } from "@/components/periodic-table/table-grid";
import { Button } from "@/components/ui/button";
import { getCategory } from "@/data";
import { formatAtomicMass } from "@/domain/elements/queries";
import type { ChemicalElement } from "@/domain/elements/types";
import { useBlankTable } from "@/hooks/useBlankTable";
import { cn } from "@/lib/utils";

export function BlankTableView() {
  const { elements, revealed, toggle, hide } = useBlankTable();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && hide();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hide]);

  return (
    <>
      <PageHeader
        title="Blank table"
        description="Every square shows only its atomic number. Tap one to reveal the element, and tapping another hides the last one."
      />

      <RevealPanel element={revealed} onHide={hide} />

      <TableGrid label="Blank periodic table">
        {elements.map((element) => {
          const isRevealed = revealed?.atomicNumber === element.atomicNumber;
          return (
            <button
              key={element.atomicNumber}
              type="button"
              onClick={() => toggle(element.atomicNumber)}
              aria-pressed={isRevealed}
              aria-label={isRevealed ? `${element.atomicNumber}: ${element.name}, ${element.symbol}` : `Element ${element.atomicNumber}`}
              data-testid={`blank-${element.atomicNumber}`}
              style={{ gridRow: element.position.row, gridColumn: element.position.column }}
              className={cn(
                "relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-md border leading-none transition",
                "focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none",
                isRevealed
                  ? cn("z-10 scale-110 shadow-md", CATEGORY_STYLES[element.category].tile)
                  : "bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {isRevealed ? (
                <>
                  <span className="absolute top-0.5 left-1 text-[8px] tabular-nums opacity-70 sm:text-[9px]">
                    {element.atomicNumber}
                  </span>
                  <span className="font-mono text-sm font-semibold sm:text-base">{element.symbol}</span>
                  <span className="mt-0.5 hidden w-full truncate text-center text-[8px] lg:block">{element.name}</span>
                </>
              ) : (
                <span className="text-xs tabular-nums sm:text-sm">{element.atomicNumber}</span>
              )}
            </button>
          );
        })}
      </TableGrid>
    </>
  );
}

function RevealPanel({ element, onHide }: { element: ChemicalElement | null; onHide: () => void }) {
  return (
    <div aria-live="polite" className="mb-4 flex min-h-20 items-center gap-4 rounded-xl border bg-card p-3 sm:p-4">
      {element ? (
        <>
          <div
            className={cn(
              "grid size-14 shrink-0 place-items-center rounded-lg border font-mono text-2xl font-semibold",
              CATEGORY_STYLES[element.category].tile,
            )}
            data-testid="revealed-symbol"
          >
            {element.symbol}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold" data-testid="revealed-name">
              {element.name}
            </div>
            <div className="text-sm text-muted-foreground">
              #{element.atomicNumber} · {getCategory(element.category).label} ·{" "}
              <span className="whitespace-nowrap">{formatAtomicMass(element)} u</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onHide}>
            <EyeOff data-icon="inline-start" /> Hide
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Think of the element first, then tap its number to check yourself.
        </p>
      )}
    </div>
  );
}
