/** Public site identity used for metadata, the sitemap, and structured data. */
export const SITE = {
  name: "Valence",
  title: "Valence: Learn the Periodic Table with Flashcards",
  description:
    "Memorize all 118 elements with free periodic table flashcards, spaced repetition, and a blank periodic table quiz. Learn ten elements at a time and track your progress.",
  keywords: [
    "periodic table",
    "learn the periodic table",
    "periodic table flashcards",
    "periodic table quiz",
    "blank periodic table",
    "memorize the periodic table",
    "element symbols",
    "atomic numbers",
    "chemistry study",
    "spaced repetition",
  ],
} as const;

/**
 * Absolute origin of the deployed site. Netlify sets `URL` at build time;
 * `NEXT_PUBLIC_SITE_URL` overrides it (e.g. for a custom domain).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? "http://localhost:4610").replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
