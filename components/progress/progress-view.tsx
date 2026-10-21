"use client";

import { Lock } from "lucide-react";
import { LoadingState } from "@/components/common/loading-state";
import { MasteryBar } from "@/components/common/mastery-bar";
import { PageHeader } from "@/components/common/page-header";
import { StatTile } from "@/components/common/stat-tile";
import { MODE_LABELS } from "@/components/flashcards/labels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { catalog } from "@/controllers";
import { useStudyProgress } from "@/hooks/useStudyProgress";
import { DataTransfer } from "./data-transfer";
import { SettingsPanel } from "./settings-panel";

const pct = (value: number) => `${Math.round(value * 100)}%`;

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ProgressView() {
  const data = useStudyProgress();
  if (!data.ready) return <LoadingState />;
  const { stats, sections, recentSessions, unlockThreshold } = data;

  return (
    <>
      <PageHeader title="Progress" description="How your recall is holding up, section by section." />

      <div className="space-y-6">
        <section aria-label="Statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Mastered"
            value={stats.masteredCards}
            hint={`of ${stats.totalCards} cards · ${stats.learningCards} learning`}
          />
          <StatTile
            label="Accuracy"
            value={stats.totalReviews ? pct(stats.accuracy) : "—"}
            hint={`${stats.ratings.again} misses in ${stats.totalReviews} reviews`}
          />
          <StatTile label="Due now" value={stats.dueNow} hint="spaced reviews" />
          <StatTile label="Day streak" value={stats.dayStreak} hint={`${stats.sessionsCompleted} sessions total`} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Sections</CardTitle>
              <CardDescription>
                A card is mastered after {data.masteryStreak} successful recalls in a row. The marker shows the{" "}
                {pct(unlockThreshold)} needed to unlock the next section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {sections.map(({ section, unlocked, mastery }) => (
                  <li key={section.id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-2.5">
                    <span className="text-sm text-muted-foreground tabular-nums">{section.id}</span>
                    <div className="min-w-0 space-y-1.5">
                      <div className="truncate text-sm font-medium">{section.title}</div>
                      {unlocked ? (
                        <MasteryBar mastery={mastery} threshold={unlockThreshold} />
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="size-3" /> Locked
                        </div>
                      )}
                    </div>
                    <span className="text-right text-xs text-muted-foreground tabular-nums">
                      {unlocked ? (
                        <>
                          <span className="font-medium text-foreground">{mastery.mastered}</span>/{mastery.total}
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No sessions yet. Finish your first study session and it will show up here.
                  </p>
                ) : (
                  <ul className="space-y-2" data-testid="session-history">
                    {recentSessions.slice(0, 8).map((s) => {
                      const section = s.sectionId ? catalog.sections.find((x) => x.id === s.sectionId) : null;
                      return (
                        <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm">
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {MODE_LABELS[s.mode]}
                              {section ? ` · Section ${section.id}` : ""}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(s.completedAt)} · {s.uniqueCards} cards
                            </div>
                          </div>
                          <span className="font-semibold tabular-nums">{pct(s.accuracy)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
            <SettingsPanel />
            <DataTransfer />
          </div>
        </div>
      </div>
    </>
  );
}
