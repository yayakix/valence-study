"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useStore } from "zustand";
import { progressController } from "@/controllers";
import { studyStore } from "@/stores/study.store";

/** Loads persisted progress once on the client and surfaces storage notices. */
export function StudyProvider({ children }: { children: React.ReactNode }) {
  const notice = useStore(studyStore, (s) => s.notice);

  useEffect(() => {
    void progressController.hydrate();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const show = notice.kind === "migrated" ? toast.info : toast.warning;
    show(notice.message, { duration: 8000 });
    progressController.dismissNotice();
  }, [notice]);

  return children;
}
