/** 18-column periodic table layout; children place themselves with gridRow/gridColumn. */
export function TableGrid({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div
          className="grid min-w-[720px] grid-cols-18 gap-0.5 sm:gap-1"
          style={{ gridTemplateRows: "repeat(7, auto) 0.6rem repeat(2, auto)" }}
          role="group"
          aria-label={label}
        >
          {children}
          {[
            { row: 6, label: "57–71" },
            { row: 7, label: "89–103" },
          ].map(({ row, label: range }) => (
            <div
              key={row}
              aria-hidden
              style={{ gridRow: row, gridColumn: 3 }}
              className="grid aspect-square place-items-center rounded-md border border-dashed text-[9px] text-muted-foreground"
            >
              {range}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground sm:hidden">Swipe sideways to see the whole table.</p>
    </>
  );
}
