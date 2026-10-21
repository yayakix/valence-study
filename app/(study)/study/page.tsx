import type { Metadata } from "next";
import { StudyView } from "@/components/flashcards/study-view";

export const metadata: Metadata = { title: "Study" };

export default function StudyPage() {
  return <StudyView />;
}
