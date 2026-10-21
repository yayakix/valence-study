"use client";

import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { useStudySession } from "@/hooks/useStudySession";
import { FlashcardSession } from "./flashcard-session";
import { SessionComplete } from "./session-complete";
import { SessionPicker } from "./session-picker";

export function StudyView() {
  const { ready, active, lastSummary, dismissSummary } = useStudySession();

  if (!ready) return <LoadingState label="Preparing your cards…" />;
  if (active) return <FlashcardSession active={active} />;
  if (lastSummary) return <SessionComplete summary={lastSummary} onDismiss={dismissSummary} />;

  return (
    <>
      <PageHeader
        title="Study"
        description="Pick a section to learn, catch up on reviews that are due, or mix everything you've unlocked."
      />
      <SessionPicker />
    </>
  );
}
