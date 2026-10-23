import type { Metadata } from "next";
import { BlankTableView } from "@/components/blank-table/blank-table-view";
import { AboutSection } from "@/components/dashboard/about-section";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Blank Periodic Table Quiz & Flashcards · Valence" },
  description:
    "Free blank periodic table quiz. Tap any atomic number to reveal the element, drill random numbers in a range you choose, and learn all 118 elements with spaced-repetition flashcards.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE.name,
          url: SITE_URL,
          description: SITE.description,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Any",
          isAccessibleForFree: true,
          educationalUse: "Memorization",
          about: { "@type": "Thing", name: "Periodic table of elements" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <BlankTableView />
      <AboutSection />
    </>
  );
}
