"use client";

import Link from "next/link";
import { ArrowRight, Flame, History, Repeat, Shuffle, Sparkles, Target, Trophy } from "lucide-react";
import { LoadingState } from "@/components/common/loading-state";
import { MasteryBar } from "@/components/common/mastery-bar";
import { StatTile } from "@/components/common/stat-tile";
import { useStartSession } from "@/components/flashcards/use-start-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudyProgress } from "@/hooks/useStudyProgress";
import { SectionGrid } from "./section-grid";

const pct = (value: number) => `${Math.round(value * 100)}%`;

export function DashboardView() {
  const data = useStudyProgress();
  const startSession = useStartSession();

  if (!data.ready) return <LoadingState />;

  const { frontier, nextLocked, stats, unlockThreshold, sections, hasActiveSession } = data;
  const needed = Math.max(0, Math.ceil(frontier.mastery.total * unlockThreshold) - frontier.mastery.mastered);
  const isNewLearner = stats.totalReviews === 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-6 font-mono text-[9rem] leading-none font-bold text-primary/[0.06] select-none"
          >
            {frontier.section.from.symbol}
          </div>
          <CardHeader>
            <CardDescription>
              {isNewLearner ? "Start here" : "Current section"} · Section {frontier.section.id} of {sections.length}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl">{frontier.section.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{frontier.section.subtitle}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <MasteryBar mastery={frontier.mastery} threshold={unlockThreshold} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {frontier.mastery.mastered} of {frontier.mastery.total} cards mastered.{" "}
                {nextLocked
                  ? needed > 0
                    ? `Master ${needed} more to unlock ${nextLocked.title}.`
                    : `${nextLocked.title} is ready to unlock.`
                  : "This is the final section of the table."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasActiveSession ? (
                <Button size="lg" nativeButton={false} render={<Link href="/study" />}>
                  Resume session
                  <ArrowRight data-icon="inline-end" />
                </Button>
              ) : (
                <Button size="lg" onClick={() => startSession("learn", frontier.section.id)}>
                  {isNewLearner ? "Start learning" : "Continue learning"}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/periodic-table" />}>
                View on the table
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="size-4 text-primary" /> Spaced review
              </CardTitle>
              <CardDescription>
                {stats.dueNow > 0
                  ? `${stats.dueNow} card${stats.dueNow === 1 ? " is" : "s are"} due for review.`
                  : isNewLearner
                    ? "Cards you study come back here right before you'd forget them."
                    : "You're all caught up. Nothing is due right now."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={stats.dueNow > 0 ? "default" : "secondary"}
                disabled={stats.dueNow === 0 || hasActiveSession}
                onClick={() => startSession("review")}
                className="w-full"
              >
                Review due cards
              </Button>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="size-4 text-primary" /> Cumulative review
              </CardTitle>
              <CardDescription>
                {data.progress.unlockedSectionIds.length === 1
                  ? "A mixed deck from your unlocked section, weakest cards first. It grows as you unlock more."
                  : `A mixed deck from all ${data.progress.unlockedSectionIds.length} unlocked sections, weakest cards first.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="secondary"
                disabled={isNewLearner || hasActiveSession}
                onClick={() => startSession("cumulative")}
                className="w-full"
              >
                Mix it up
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-label="Statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Trophy} label="Mastered" value={`${stats.masteredCards}/${stats.totalCards}`} hint="cards" />
        <StatTile
          icon={Target}
          label="Accuracy"
          value={stats.totalReviews ? pct(stats.accuracy) : "—"}
          hint={`${stats.totalReviews} reviews`}
        />
        <StatTile icon={Flame} label="Streak" value={`${stats.dayStreak} day${stats.dayStreak === 1 ? "" : "s"}`} hint="in a row" />
        <StatTile icon={History} label="Sessions" value={stats.sessionsCompleted} hint="completed" />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-4 text-primary" /> Sections
            </h2>
            <p className="text-sm text-muted-foreground">
              Ten elements at a time. Master {pct(unlockThreshold)} of a section&apos;s cards to open the next.
            </p>
          </div>
        </div>
        <SectionGrid
          sections={sections}
          unlockThreshold={unlockThreshold}
          onStudy={(sectionId) => startSession("learn", sectionId)}
        />
      </section>
    </div>
  );
}
