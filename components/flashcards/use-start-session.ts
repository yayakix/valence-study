"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStudySession } from "@/hooks/useStudySession";
import type { SessionMode } from "@/domain/study/types";

const FAILURE_MESSAGES = {
  locked: "That section is still locked. Master the current section to open it.",
  "no-cards": "Nothing to study here right now. You're all caught up!",
  "unknown-section": "That section doesn't exist.",
} as const;

/** Starts a session and moves to the study screen, or explains why it couldn't start. */
export function useStartSession() {
  const router = useRouter();
  const { start } = useStudySession();
  return (mode: SessionMode, sectionId: number | null = null) => {
    const result = start(mode, sectionId);
    if (!result.ok) {
      toast.info(FAILURE_MESSAGES[result.reason]);
      return false;
    }
    router.push("/study");
    return true;
  };
}
