import type { Metadata } from "next";
import { PeriodicTableView } from "@/components/periodic-table/periodic-table-view";

export const metadata: Metadata = { title: "Periodic table" };

export default function PeriodicTablePage() {
  return <PeriodicTableView />;
}
