import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { CATEGORY_STYLES } from "@/components/periodic-table/category-styles";
import { DEFAULT_CATALOG } from "@/data";
import { elementSlug } from "@/domain/elements/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All 118 Elements: Names, Symbols & Atomic Numbers",
  description:
    "A list of every element on the periodic table in order of atomic number, with symbols and names. Grouped into sections of ten to make memorizing them easier.",
  alternates: { canonical: "/elements" },
};

export default function ElementsPage() {
  return (
    <>
      <PageHeader
        title="All 118 elements"
        description="Every element on the periodic table in order of atomic number, split into sections of ten, the same chunks Valence uses for flashcards."
      />
      <div className="space-y-8">
        {DEFAULT_CATALOG.sections.map((section) => (
          <section key={section.id} aria-labelledby={`section-${section.id}`}>
            <h2 id={`section-${section.id}`} className="mb-3 text-lg font-semibold">
              Section {section.id}: {section.from.name} to {section.to.name}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({section.from.atomicNumber}–{section.to.atomicNumber})
              </span>
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {section.atomicNumbers.map((n) => {
                const element = DEFAULT_CATALOG.elements[n - 1]!;
                return (
                  <li key={n}>
                    <Link
                      href={`/elements/${elementSlug(element)}`}
                      className="flex items-center gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-muted"
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-md border font-mono font-semibold",
                          CATEGORY_STYLES[element.category].tile,
                        )}
                      >
                        {element.symbol}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{element.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">#{element.atomicNumber}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
