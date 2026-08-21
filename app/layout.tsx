import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/layout/site-shell";
import { ReadingModeProvider } from "@/components/reading/reading-mode-provider";

export const metadata: Metadata = {
  title: "Adaptiva - Adaptive accessibility for learning",
  description:
    "An AI-powered accessibility layer that transforms educational content around each learner's needs."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ReadingModeProvider>
          <SiteShell>{children}</SiteShell>
        </ReadingModeProvider>
      </body>
    </html>
  );
}
