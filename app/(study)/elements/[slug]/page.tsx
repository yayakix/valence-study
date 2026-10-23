import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingState } from "@/components/common/loading-state";
import { describeElement, formatPhase, symbolOrigin } from "@/components/elements/element-copy";
import { CATEGORY_STYLES } from "@/components/periodic-table/category-styles";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { DEFAULT_CATALOG, getCategory } from "@/data";
import { elementSlug, findElementBySlug, formatAtomicMass } from "@/domain/elements/queries";
import type { ChemicalElement } from "@/domain/elements/types";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const { elements } = DEFAULT_CATALOG;

export function generateStaticParams() {
  return elements.map((element) => ({ slug: elementSlug(element) }));
}

async function resolveElement(params: Promise<{ slug: string }>): Promise<ChemicalElement> {
  const element = findElementBySlug(elements, (await params).slug);
  if (!element) notFound();
  return element;
}

export async function generateMetadata({ params }: PageProps<"/elements/[slug]">): Promise<Metadata> {
  const element = findElementBySlug(elements, (await params).slug);
  if (!element) return {};
  const title = `${element.name} (${element.symbol}): Atomic Number ${element.atomicNumber}, Facts & Flashcards`;
  const description = describeElement(element);
  const path = `/elements/${elementSlug(element)}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "article" },
  };
}

function ElementLink({ element, direction }: { element: ChemicalElement; direction: "prev" | "next" }) {
  return (
    <Link
      href={`/elements/${elementSlug(element)}`}
      className={cn(
        "flex flex-1 items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted",
        direction === "next" && "justify-end text-right",
      )}
    >
      {direction === "prev" && <ArrowLeft className="size-4 shrink-0" aria-hidden />}
      <span>
        <span className="block text-xs text-muted-foreground">{direction === "prev" ? "Previous" : "Next"}</span>
        {element.atomicNumber}. {element.name} ({element.symbol})
      </span>
      {direction === "next" && <ArrowRight className="size-4 shrink-0" aria-hidden />}
    </Link>
  );
}

export default function ElementPage({ params }: PageProps<"/elements/[slug]">) {
  return (
    <Suspense fallback={<LoadingState label="Loading element…" />}>
      <ElementContent params={params} />
    </Suspense>
  );
}

async function ElementContent({ params }: { params: PageProps<"/elements/[slug]">["params"] }) {
  const element = await resolveElement(params);
  const category = getCategory(element.category);
  const section = DEFAULT_CATALOG.sectionOf(element.atomicNumber);
  const prev = elements[element.atomicNumber - 2];
  const next = elements[element.atomicNumber];
  const groupMates =
    element.group === null
      ? elements.filter((e) => e.group === null && e.category === element.category && e !== element)
      : elements.filter((e) => e.group === element.group && e !== element);
  const origin = symbolOrigin(element);
  const facts: [string, string][] = [
    ["Symbol", element.symbol],
    ["Atomic number", String(element.atomicNumber)],
    ["Atomic mass", formatAtomicMass(element)],
    ["Category", category.label],
    ["Period", String(element.period)],
    ["Group", element.group === null ? "—" : String(element.group)],
    ["Block", `${element.block}-block`],
    ["State at 25 °C", formatPhase(element)],
  ];

  return (
    <article className="mx-auto w-full max-w-3xl space-y-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Elements", item: absoluteUrl("/elements") },
            {
              "@type": "ListItem",
              position: 2,
              name: element.name,
              item: absoluteUrl(`/elements/${elementSlug(element)}`),
            },
          ],
        }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/elements" className="hover:text-foreground hover:underline">
          Elements
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{element.name}</span>
      </nav>

      <header className="flex items-center gap-4">
        <div
          className={cn(
            "relative grid size-20 shrink-0 place-items-center rounded-xl border font-mono text-3xl font-semibold sm:size-24 sm:text-4xl",
            CATEGORY_STYLES[element.category].tile,
          )}
        >
          <span className="absolute top-1 left-2 text-xs font-normal tabular-nums opacity-70">
            {element.atomicNumber}
          </span>
          {element.symbol}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {element.name} ({element.symbol})
          </h1>
          <p className="text-muted-foreground">
            Element {element.atomicNumber} · {category.label}
            {element.altNames.length > 0 && ` · also spelled ${element.altNames.join(", ")}`}
          </p>
        </div>
      </header>

      <p className="leading-relaxed">{describeElement(element)}</p>

      <section aria-labelledby="facts">
        <h2 id="facts" className="mb-3 text-lg font-semibold">
          {element.name} facts
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="bg-card p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{category.label}:</span> {category.description}
        </p>
      </section>

      {origin && (
        <section aria-labelledby="symbol">
          <h2 id="symbol" className="mb-2 text-lg font-semibold">
            Why is {element.name.toLowerCase()}’s symbol {element.symbol}?
          </h2>
          <p className="leading-relaxed">{origin}</p>
        </section>
      )}

      <section aria-labelledby="memorize" className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
        <h2 id="memorize" className="text-lg font-semibold">
          Memorize {element.name.toLowerCase()}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {element.name} is in section {section.id} of Valence, alongside the other elements from{" "}
          {section.from.name} ({section.from.atomicNumber}) to {section.to.name} ({section.to.atomicNumber}).
          Practice it with flashcards, or quiz yourself on a blank periodic table by atomic number.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/study" />}>
            Study with flashcards
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Blank periodic table quiz
          </Button>
        </div>
      </section>

      {groupMates.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="mb-3 text-lg font-semibold">
            {element.group === null ? `Other ${category.label.toLowerCase()}s` : `Other group ${element.group} elements`}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {groupMates.map((mate) => (
              <li key={mate.atomicNumber}>
                <Link
                  href={`/elements/${elementSlug(mate)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
                >
                  <span className="font-mono font-semibold">{mate.symbol}</span>
                  {mate.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Neighboring elements" className="flex flex-col gap-2 sm:flex-row">
        {prev && <ElementLink element={prev} direction="prev" />}
        {next && <ElementLink element={next} direction="next" />}
      </nav>
    </article>
  );
}
