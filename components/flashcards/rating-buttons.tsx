"use client";

import { Button } from "@/components/ui/button";
import { RECALL_RATINGS, type RecallRating } from "@/domain/study/types";
import { cn } from "@/lib/utils";

const META: Record<RecallRating, { label: string; className: string }> = {
  again: { label: "Again", className: "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100" },
  hard: { label: "Hard", className: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100" },
  good: { label: "Good", className: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100" },
  easy: { label: "Easy", className: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100" },
};

export function RatingButtons({
  intervals,
  onRate,
}: {
  intervals: Record<RecallRating, string> | null;
  onRate: (rating: RecallRating) => void;
}) {
  return (
    <div role="group" aria-label="How well did you recall it?" className="grid grid-cols-4 gap-2">
      {RECALL_RATINGS.map((rating, index) => (
        <Button
          key={rating}
          variant="outline"
          onClick={() => onRate(rating)}
          className={cn("h-auto flex-col gap-0.5 py-2.5", META[rating].className)}
          aria-keyshortcuts={String(index + 1)}
        >
          <span className="text-sm font-semibold">{META[rating].label}</span>
          <span className="text-[11px] font-normal opacity-70">
            {intervals?.[rating]}
            <span className="hidden sm:inline"> · {index + 1}</span>
          </span>
        </Button>
      ))}
    </div>
  );
}
