import type { Metadata } from "next";
import { StudyView } from "@/components/flashcards/study-view";

export const metadata: Metadata = {
  title: "Periodic Table Flashcards",
  description:
    "Study element names and symbols with flashcards that use spaced repetition. Learn ten elements at a time and unlock the next section as you go.",
  alternates: { canonical: "/study" },
};

export default function StudyPage() {
  return <StudyView />;
}
