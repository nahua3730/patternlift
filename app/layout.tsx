import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PatternLiftStateProvider } from "@/components/patternlift-state";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "PatternLift — Adaptive Coding Interview Coach",
  description:
    "Train coding-pattern recognition with adaptive mastery, confusion-pair diagnosis, spaced recall, and voice interview practice."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <PatternLiftStateProvider isAuthenticated={Boolean(currentUser)}>
          <AppShell currentUser={currentUser}>{children}</AppShell>
        </PatternLiftStateProvider>
      </body>
    </html>
  );
}
