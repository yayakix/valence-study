"use client";

import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { CATEGORIES } from "@/data";
import { usePeriodicTable } from "@/hooks/usePeriodicTable";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES } from "./category-styles";
import { ElementDetailDialog } from "./element-detail-dialog";
import { ElementTile } from "./element-tile";

export function PeriodicTableView() {
  const { ready, cells, selected, select, categoryFilter, setCategoryFilter } = usePeriodicTable();

  if (!ready) return <LoadingState label="Loading the periodic table…" />;

  const unlockedCount = cells.filter((c) => c.unlocked).length;
  const masteredCount = cells.filter((c) => c.level === "mastered").length;

  return (
    <>
      <PageHeader
        title="Periodic table"
        description={`${unlockedCount} of ${cells.length} elements unlocked, ${masteredCount} fully mastered. Tap any element for details.`}
      />

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div
          className="grid min-w-[720px] grid-cols-18 gap-0.5 sm:gap-1"
          style={{ gridTemplateRows: "repeat(7, auto) 0.6rem repeat(2, auto)" }}
          role="group"
          aria-label="Periodic table of elements"
        >
          {cells.map((cell) => (
            <ElementTile key={cell.element.atomicNumber} cell={cell} onSelect={select} />
          ))}
          {[
            { row: 6, label: "57–71" },
            { row: 7, label: "89–103" },
          ].map(({ row, label }) => (
            <div
              key={row}
              aria-hidden
              style={{ gridRow: row, gridColumn: 3 }}
              className="grid aspect-square place-items-center rounded-md border border-dashed text-[9px] text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground sm:hidden">Swipe sideways to see the whole table.</p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORIES.map((category) => {
          const active = categoryFilter === category.id;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCategoryFilter(active ? null : category.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-muted",
                active && "border-foreground/40 bg-muted font-medium",
              )}
            >
              <span className={cn("size-2.5 rounded-full", CATEGORY_STYLES[category.id].swatch)} />
              {category.label}
            </button>
          );
        })}
      </div>

      <ElementDetailDialog detail={selected} onClose={() => select(null)} />
    </>
  );
}
