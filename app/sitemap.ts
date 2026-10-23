import type { MetadataRoute } from "next";
import { ELEMENTS } from "@/data";
import { elementSlug } from "@/domain/elements/queries";
import { absoluteUrl } from "@/lib/site";

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/periodic-table", priority: 0.9 },
  { path: "/study", priority: 0.8 },
  { path: "/elements", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES.map(({ path, priority }) => ({ url: absoluteUrl(path), changeFrequency: "monthly" as const, priority })),
    ...ELEMENTS.map((element) => ({
      url: absoluteUrl(`/elements/${elementSlug(element)}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
