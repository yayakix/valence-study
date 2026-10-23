"use client";

import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { CATEGORIES } from "@/data";
import { usePeriodicTable } from "@/hooks/usePeriodicTable";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES } from "./category-styles";
import { ElementDetailDialog } from "./element-detail-dialog";
import { ElementTile } from "./element-tile";
import { TableGrid } from "./table-grid";

export function PeriodicTableView() {
  const { ready, cells, selected, select, categoryFilter, setCategoryFilter } = usePeriodicTable();

  const unlockedCount = cells.filter((c) => c.unlocked).length;
  const masteredCount = cells.filter((c) => c.level === "mastered").length;

  return (
    <>
      <PageHeader
        title="Periodic table"
        description={
          <>
            {ready
              ? `${unlockedCount} of ${cells.length} elements unlocked, ${masteredCount} fully mastered. `
              : "All 118 elements, color-coded by category. "}
            Tap any element for details, or{" "}
            <Link href="/elements" className="text-primary hover:underline">
              browse the full list
            </Link>
            .
          </>
        }
      />

      <TableGrid label="Periodic table of elements">
        {cells.map((cell) => (
          <ElementTile key={cell.element.atomicNumber} cell={cell} onSelect={select} />
        ))}
      </TableGrid>

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
