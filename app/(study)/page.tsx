import { AboutSection } from "@/components/dashboard/about-section";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE, SITE_URL } from "@/lib/site";

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
      <h1 className="mb-4 text-sm font-medium text-muted-foreground">
        Learn the periodic table: flashcards, spaced repetition, and a blank-table quiz
      </h1>
      <DashboardView />
      <AboutSection />
    </>
  );
}
