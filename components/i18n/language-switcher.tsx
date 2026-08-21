"use client";

import { Languages } from "lucide-react";
import { useId } from "react";
import { useAppLanguage } from "@/components/i18n/language-provider";
import { languageOptions } from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const { language, setLanguage, status } = useAppLanguage();

  return (
    <div
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-card border border-ink/10 bg-white px-3 text-ink shadow-sm",
        compact ? "w-full" : "max-w-[15rem]"
      )}
      data-no-translate
      translate="no"
    >
      <Languages aria-hidden="true" className="shrink-0 text-moss" size={17} />
      <label className="sr-only" htmlFor={id}>
        Translation language
      </label>
      <select
        id={id}
        aria-label="Translation language"
        className="min-h-10 min-w-0 flex-1 bg-transparent text-sm font-black text-ink outline-none"
        value={language}
        onChange={(event) => setLanguage(event.target.value as typeof language)}
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.nativeLabel} · {option.label}
          </option>
        ))}
      </select>
      {status === "translating" ? (
        <span
          aria-label="Translating page"
          className="size-2 shrink-0 animate-pulse rounded-full bg-moss"
        />
      ) : null}
    </div>
  );
}
