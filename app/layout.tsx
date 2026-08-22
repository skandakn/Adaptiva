import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AppLanguageProvider } from "@/components/i18n/language-provider";
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
        <ClerkProvider afterSignOutUrl="/" signInUrl="/auth/sign-in" signUpUrl="/auth/sign-up">
          <AppLanguageProvider>
            <ReadingModeProvider>
              <SiteShell>{children}</SiteShell>
            </ReadingModeProvider>
          </AppLanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
