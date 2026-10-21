"use client";

import { Lock } from "lucide-react";
import { CARD_KIND_LABELS, MASTERY_LABELS } from "@/components/flashcards/labels";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCategory } from "@/data";
import { formatAtomicMass } from "@/domain/elements/queries";
import type { ElementDetail } from "@/hooks/usePeriodicTable";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES } from "./category-styles";

function formatDue(dueAt: number) {
  return new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ElementDetailDialog({ detail, onClose }: { detail: ElementDetail | null; onClose: () => void }) {
  return (
    <Dialog open={detail !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {detail && <DetailBody detail={detail} />}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({ detail }: { detail: ElementDetail }) {
  const { element, unlocked, sectionId, cards } = detail;
  const category = getCategory(element.category);
  const facts: [string, string][] = [
    ["Atomic number", String(element.atomicNumber)],
    ["Atomic mass", formatAtomicMass(element)],
    ["Period", String(element.period)],
    ["Group", element.group === null ? "—" : String(element.group)],
    ["Block", `${element.block}-block`],
    ["State at 25 °C", element.phase === "unknown" ? "Unknown" : element.phase[0]!.toUpperCase() + element.phase.slice(1)],
  ];

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "grid size-16 shrink-0 place-items-center rounded-lg border font-mono text-2xl font-semibold",
              CATEGORY_STYLES[element.category].tile,
            )}
          >
            {element.symbol}
          </div>
          <div>
            <DialogTitle className="text-xl">{element.name}</DialogTitle>
            <DialogDescription>
              {category.label}
              {element.altNames.length > 0 && ` · also “${element.altNames.join("”, “")}”`}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">{category.description}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Section {sectionId}</span>
          {!unlocked && (
            <Badge variant="outline" className="gap-1">
              <Lock /> Locked
            </Badge>
          )}
        </div>
        <ul className="space-y-1.5 text-sm">
          {cards.map(({ kind, level, state }) => (
            <li key={kind} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{CARD_KIND_LABELS[kind]}</span>
              <span className="text-right">
                <Badge variant={level === "mastered" ? "default" : level === "learning" ? "secondary" : "outline"}>
                  {MASTERY_LABELS[level]}
                </Badge>
                {state?.lastReviewedAt && (
                  <span className="ml-2 text-xs text-muted-foreground">due {formatDue(state.dueAt)}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
