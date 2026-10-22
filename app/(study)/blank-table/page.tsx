import type { Metadata } from "next";
import { BlankTableView } from "@/components/blank-table/blank-table-view";

export const metadata: Metadata = { title: "Blank table" };

export default function BlankTablePage() {
  return <BlankTableView />;
}
