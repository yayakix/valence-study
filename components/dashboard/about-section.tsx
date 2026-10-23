import Link from "next/link";

const FEATURES = [
  {
    title: "Periodic table flashcards",
    body: "See a symbol, recall the name, or the other way around. Each card tracks how well you know it.",
    href: "/study",
    link: "Start studying",
  },
  {
    title: "Ten elements at a time",
    body: "The table is split into sections of ten. Master most of a section to unlock the next one, so you never face all 118 at once.",
    href: "/elements",
    link: "See all 118 elements",
  },
  {
    title: "Spaced repetition",
    body: "Cards come back right before you would forget them, and cumulative reviews mix in everything you have learned so far.",
    href: "/study",
    link: "Review your cards",
  },
  {
    title: "Blank periodic table quiz",
    body: "Test yourself on an empty table that shows only atomic numbers, or drill a big number on its own so you learn the number, not just the position.",
    href: "/blank-table",
    link: "Try the blank table",
  },
];

export function AboutSection() {
  return (
    <section aria-labelledby="how-it-works" className="mt-12 space-y-4 border-t pt-8">
      <div>
        <h2 id="how-it-works" className="text-lg font-semibold">
          How to memorize the periodic table with Valence
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Valence is a free study tool for learning every element&apos;s name, symbol, and atomic number. It runs in
          your browser and saves your progress on your device, with no account needed.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border bg-card p-4">
            <h3 className="font-medium">{feature.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
            <Link href={feature.href} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
              {feature.link} →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
