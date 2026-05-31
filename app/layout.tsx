import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PatternLiftStateProvider } from "@/components/patternlift-state";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "PatternLift",
  description: "AI-assisted LeetCode pattern coach for recognition, recall, and review."
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
