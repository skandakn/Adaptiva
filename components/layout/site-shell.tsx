"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ReadingModeQuickControl } from "@/components/reading/reading-mode-quick-control";
import { AskAdaptivaWidget } from "@/components/tutor/ask-adaptiva-widget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
  { href: "/learn/figure", label: "Figure" },
  { href: "/video", label: "Video" },
  { href: "/architecture", label: "Architecture" }
];

const secondaryNav = [
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
  { href: "/about", label: "Impact" }
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const allNav = [...primaryNav, ...secondaryNav];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "min-h-11 rounded-card px-4 py-3 text-sm font-bold text-graphite transition hover:bg-cloud hover:text-ink",
                  pathname === item.href && "bg-ink text-white hover:bg-ink hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />
            <ReadingModeQuickControl />
            <Show when="signed-out">
              <Button variant="secondary" asChild>
                <Link href="/auth/sign-in">
                  <LogIn aria-hidden="true" size={16} />
                  Sign in
                </Link>
              </Button>
              <Button asChild>
                <Link href="/onboarding">Try Adaptiva</Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <Button variant="secondary" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard aria-hidden="true" size={16} />
                  Dashboard
                </Link>
              </Button>
              <UserButton />
            </Show>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <ReadingModeQuickControl />
            <button
              type="button"
              className="grid size-11 place-items-center rounded-card border border-ink/10 bg-white text-ink shadow-sm"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
            </button>
          </div>
        </div>
        {open ? (
          <nav
            className="border-t border-ink/10 bg-white px-4 py-4 lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="grid gap-2">
              <LanguageSwitcher compact />
              {allNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "min-h-12 rounded-card px-4 py-3 text-sm font-bold text-graphite transition hover:bg-cloud hover:text-ink",
                    pathname === item.href && "bg-ink text-white hover:bg-ink hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Button className="mt-2" asChild>
                <Link href="/onboarding" onClick={() => setOpen(false)}>
                  Try Adaptiva
                </Link>
              </Button>
              <Show when="signed-out">
                <Button variant="secondary" asChild>
                  <Link href="/auth/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              </Show>
              <Show when="signed-in">
                <div className="mt-2 flex min-h-12 items-center justify-between rounded-card border border-ink/10 bg-paper px-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 text-sm font-black text-ink"
                  >
                    <LayoutDashboard aria-hidden="true" size={16} />
                    Dashboard
                  </Link>
                  <UserButton />
                </div>
              </Show>
            </div>
          </nav>
        ) : null}
      </header>
      <main id="main-content">{children}</main>
      <AskAdaptivaWidget />
      <footer className="border-t border-ink/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-md text-sm text-graphite">
              Technology that adapts to the way you learn.
            </p>
          </div>
          <nav
            className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5"
            aria-label="Footer navigation"
          >
            {allNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="min-h-11 rounded-card px-3 py-2 font-semibold text-graphite transition hover:bg-cloud hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
