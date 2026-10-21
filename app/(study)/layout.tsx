import { AppShell } from "@/components/layout/app-shell";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
