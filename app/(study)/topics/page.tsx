import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DeckProgressBadge } from "@/components/decks/deck-progress-badge";
import { DECKS } from "@/data/decks";

export const metadata: Metadata = {
  title: "Study Topics: Flashcards Beyond the Periodic Table",
  description:
    "Free flashcards with spaced repetition for more than chemistry, starting with the NATO phonetic alphabet. Learn in small sections and pick exactly what to practice.",
  alternates: { canonical: "/topics" },
};

const COMING_SOON = ["Morse code", "US presidents", "Spanish words", "Phlebotomy tubes", "Country flags", "US states"];

export default function TopicsPage() {
  return (
    <>
      <PageHeader
        title="Topics"
        description="The same flashcards and spaced repetition as the periodic table, for other things worth knowing."
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <Link href="/" className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted">
            <span className="font-semibold">Periodic table</span>
            <span className="text-sm text-muted-foreground">All 118 elements, with the blank table, number drill, and flashcards.</span>
            <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
              Open <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </li>
        {DECKS.map((deck) => (
          <li key={deck.id}>
            <Link
              href={`/topics/${deck.id}`}
              className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
            >
              <span className="font-semibold">{deck.title}</span>
              <span className="text-sm text-muted-foreground">{deck.description}</span>
              <span className="mt-auto flex items-center justify-between gap-2">
                <DeckProgressBadge deckId={deck.id} />
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  Study <ArrowRight className="size-3.5" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Coming soon</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {COMING_SOON.map((topic) => (
            <li key={topic} className="rounded-full border border-dashed px-3 py-1 text-sm text-muted-foreground">
              {topic}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
