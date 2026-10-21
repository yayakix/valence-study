import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StudyProvider } from "@/components/providers/study-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Valence · Periodic table study",
    template: "%s · Valence",
  },
  description:
    "Learn all 118 elements with flashcards, progressive sections of ten, cumulative reviews, and spaced repetition.",
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <StudyProvider>{children}</StudyProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
