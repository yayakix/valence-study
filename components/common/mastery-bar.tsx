import type { MasterySummary } from "@/domain/study/types";
import { cn } from "@/lib/utils";

/** Stacked bar: mastered, learning, then unseen cards, with an optional unlock threshold marker. */
export function MasteryBar({
  mastery,
  threshold,
  className,
}: {
  mastery: MasterySummary;
  threshold?: number;
  className?: string;
}) {
  const pct = (n: number) => (mastery.total === 0 ? 0 : (n / mastery.total) * 100);
  return (
    <div
      role="progressbar"
      aria-label="Section mastery"
      aria-valuemin={0}
      aria-valuemax={mastery.total}
      aria-valuenow={mastery.mastered}
      aria-valuetext={`${mastery.mastered} of ${mastery.total} cards mastered`}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className="flex h-full">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct(mastery.mastered)}%` }} />
        <div className="h-full bg-primary/35 transition-all" style={{ width: `${pct(mastery.learning)}%` }} />
      </div>
      {threshold !== undefined && (
        <div
          aria-hidden
          className="absolute inset-y-0 w-0.5 bg-foreground/40"
          style={{ left: `${threshold * 100}%` }}
        />
      )}
    </div>
  );
}
