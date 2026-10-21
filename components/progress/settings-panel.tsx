"use client";

import { toast } from "sonner";
import { CARD_KIND_LABELS } from "@/components/flashcards/labels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CARD_KINDS, type CardKind } from "@/domain/study/types";
import { useProgressData } from "@/hooks/useProgressData";
import { cn } from "@/lib/utils";

const SESSION_SIZES = [10, 20, 30, 50] as const;

const toggleClass = (active: boolean) =>
  cn(
    "rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted",
    active && "border-primary bg-accent font-medium",
  );

export function SettingsPanel() {
  const { settings, updateSettings } = useProgressData();

  const toggleKind = async (kind: CardKind) => {
    const enabled = settings.cardKinds.includes(kind);
    if (enabled && settings.cardKinds.length === 1) {
      toast.info("Keep at least one card type switched on.");
      return;
    }
    await updateSettings({
      cardKinds: enabled ? settings.cardKinds.filter((k) => k !== kind) : [...settings.cardKinds, kind],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study settings</CardTitle>
        <CardDescription>Changes apply to the next session you start.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Cards per session</legend>
          <div className="flex flex-wrap gap-2">
            {SESSION_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                aria-pressed={settings.sessionSize === size}
                onClick={() => updateSettings({ sessionSize: size })}
                className={toggleClass(settings.sessionSize === size)}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Card types</legend>
          <p className="text-xs text-muted-foreground">
            Each element gets one card per type. Mastery and unlocking count only the types switched on.
          </p>
          <div className="flex flex-wrap gap-2">
            {CARD_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={settings.cardKinds.includes(kind)}
                onClick={() => toggleKind(kind)}
                className={toggleClass(settings.cardKinds.includes(kind))}
              >
                {CARD_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
