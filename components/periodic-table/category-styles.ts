import type { ElementCategory } from "@/domain/elements/types";

export const CATEGORY_STYLES: Record<ElementCategory, { tile: string; swatch: string }> = {
  "alkali-metal": { tile: "bg-rose-100 text-rose-950 border-rose-200", swatch: "bg-rose-400" },
  "alkaline-earth-metal": { tile: "bg-orange-100 text-orange-950 border-orange-200", swatch: "bg-orange-400" },
  "transition-metal": { tile: "bg-sky-100 text-sky-950 border-sky-200", swatch: "bg-sky-400" },
  "post-transition-metal": { tile: "bg-emerald-100 text-emerald-950 border-emerald-200", swatch: "bg-emerald-400" },
  metalloid: { tile: "bg-lime-100 text-lime-950 border-lime-200", swatch: "bg-lime-500" },
  "reactive-nonmetal": { tile: "bg-yellow-100 text-yellow-950 border-yellow-200", swatch: "bg-yellow-400" },
  "noble-gas": { tile: "bg-violet-100 text-violet-950 border-violet-200", swatch: "bg-violet-400" },
  lanthanide: { tile: "bg-pink-100 text-pink-950 border-pink-200", swatch: "bg-pink-400" },
  actinide: { tile: "bg-fuchsia-100 text-fuchsia-950 border-fuchsia-200", swatch: "bg-fuchsia-400" },
  unknown: { tile: "bg-zinc-100 text-zinc-800 border-zinc-200", swatch: "bg-zinc-400" },
};
