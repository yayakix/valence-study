import type { Metadata } from "next";
import { PeriodicTableView } from "@/components/periodic-table/periodic-table-view";

export const metadata: Metadata = {
  title: "Interactive Periodic Table of Elements",
  description:
    "An interactive, color-coded periodic table of all 118 elements. Tap any element for its symbol, atomic number, mass, group, period, and block.",
  alternates: { canonical: "/periodic-table" },
};

export default function PeriodicTablePage() {
  return <PeriodicTableView />;
}
