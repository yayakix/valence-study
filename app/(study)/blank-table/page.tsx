import type { Metadata } from "next";
import { BlankTableView } from "@/components/blank-table/blank-table-view";

export const metadata: Metadata = {
  title: "Blank Periodic Table Quiz: Name the Elements by Number",
  description:
    "Free blank periodic table quiz. Tap any atomic number to reveal the element, or drill random numbers in a range you choose, like 1 to 20.",
  alternates: { canonical: "/blank-table" },
};

export default function BlankTablePage() {
  return <BlankTableView />;
}
