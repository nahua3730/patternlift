import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PatternLiftStateProvider } from "@/components/patternlift-state";
import "./globals.css";

export const metadata: Metadata = {
  title: "PatternLift",
  description: "AI-assisted LeetCode pattern coach for recognition, recall, and review."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PatternLiftStateProvider>
          <AppShell>{children}</AppShell>
        </PatternLiftStateProvider>
      </body>
    </html>
  );
}
