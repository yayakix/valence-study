import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoadingState } from "@/components/common/loading-state";
import { DeckStudy } from "@/components/decks/deck-study";
import { DECKS, getDeck } from "@/data/decks";
import { ArrowRight } from "lucide-react";

export function generateStaticParams() {
  return DECKS.map((deck) => ({ deck: deck.id }));
}

export async function generateMetadata({ params }: PageProps<"/topics/[deck]">): Promise<Metadata> {
  const deck = getDeck((await params).deck);
  if (!deck) return {};
  return {
    title: `${deck.title} Flashcards & Chart`,
    description: `${deck.description} Learn it with free flashcards and spaced repetition.`,
    alternates: { canonical: `/topics/${deck.id}` },
  };
}

export default function TopicPage({ params }: PageProps<"/topics/[deck]">) {
  return (
    <Suspense fallback={<LoadingState label="Loading topic…" />}>
      <TopicContent params={params} />
    </Suspense>
  );
}

async function TopicContent({ params }: { params: PageProps<"/topics/[deck]">["params"] }) {
  const deck = getDeck((await params).deck);
  if (!deck) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-muted-foreground">
        <Link href="/topics" className="hover:text-foreground hover:underline">
          Topics
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{deck.shortTitle}</span>
      </nav>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{deck.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{deck.description}</p>
      </div>

      <DeckStudy deckId={deck.id} />

      <section aria-labelledby="chart" className="mt-12">
        <h2 id="chart" className="mb-3 text-lg font-semibold">
          {deck.shortTitle} chart
        </h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {deck.fields.map((field) => (
                  <th key={field.id} scope="col" className="px-3 py-2 font-medium">
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deck.items.map((item) => (
                <tr key={item.id} className="border-t">
                  {deck.fields.map((field, index) => (
                    <td key={field.id} className={index === 0 ? "px-3 py-2 font-semibold" : "px-3 py-2"}>
                      {item.fields[field.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <nav aria-labelledby="more-topics" className="mt-12">
        <h2 id="more-topics" className="mb-3 text-lg font-semibold">
          More to learn
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            { href: "/", title: "Periodic table", body: "Blank table quiz, number drill, and flashcards" },
            ...DECKS.filter((other) => other.id !== deck.id).map((other) => ({
              href: `/topics/${other.id}`,
              title: other.title,
              body: other.description,
            })),
            { href: "/topics", title: "All topics", body: "See everything you can study" },
          ].map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{link.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">{link.body}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
