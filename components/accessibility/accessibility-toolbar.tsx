"use client";

import { Contrast, Languages, RotateCcw, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ReadingContent } from "@/components/reading/reading-content";
import { ReadingModeControls } from "@/components/reading/reading-mode-controls";
import { useReadingMode } from "@/components/reading/reading-mode-provider";
import { Button } from "@/components/ui/button";
import { readingPreferencesToProfilePayload } from "@/lib/reading-mode";
import { cn } from "@/lib/utils";

const previewText =
  "Photo-syn-the-sis is how green plants use light energy to make chemical energy. Chlorophyll helps the plant capture sunlight.";

export function AccessibilityToolbar() {
  const { preferences, resetReadingMode } = useReadingMode();
  const [language, setLanguage] = useState<"English" | "Kannada" | "Hindi">("English");
  const [contrast, setContrast] = useState(false);
  const [motion, setMotion] = useState(false);
  const [message, setMessage] = useState("Reading preferences restore automatically on this device.");

  useEffect(() => {
    document.body.classList.toggle("high-contrast", contrast);
    document.body.classList.toggle("reduced-motion", motion);
    return () => {
      document.body.classList.remove("high-contrast", "reduced-motion");
    };
  }, [contrast, motion]);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const response = await fetch("/api/profile");
        const data = (await response.json()) as {
          profile?: { preferred_language?: "English" | "Kannada" | "Hindi" };
        };
        if (response.ok && data.profile?.preferred_language) {
          setLanguage(data.profile.preferred_language);
        }
      } catch {
        setMessage("Using local demo settings because persistence is unavailable.");
      }
    }

    void loadLanguage();
  }, []);

  async function saveSettings() {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...readingPreferencesToProfilePayload(preferences),
          preferred_language: language
        })
      });
      if (!response.ok) throw new Error("Save failed");
      setMessage("Settings saved.");
    } catch {
      setMessage("Settings could not be saved to the database. Local demo preferences are still saved.");
    }
  }

  return (
    <section
      id="accessibility-controls"
      className="rounded-card border border-ink/10 bg-white p-4 shadow-soft"
      aria-label="Accessibility controls"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
            Accessibility Controls
          </p>
          <p className="text-sm text-graphite">Reading Mode applies to learning content, not navigation or system UI.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              resetReadingMode();
              setLanguage("English");
              setContrast(false);
              setMotion(false);
              setMessage("Settings reset.");
            }}
          >
            <RotateCcw aria-hidden="true" size={16} />
            Reset
          </Button>
          <Button type="button" onClick={() => void saveSettings()}>
            Save Settings
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <ReadingModeControls textToRead={previewText} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ControlGroup label="Language" icon={Languages}>
          <select
            aria-label="Preferred language"
            className="min-h-11 w-full rounded-card border border-ink/10 bg-white px-3 font-black"
            value={language}
            onChange={(event) => setLanguage(event.target.value as "English" | "Kannada" | "Hindi")}
          >
            <option>English</option>
            <option>Kannada</option>
            <option>Hindi</option>
          </select>
        </ControlGroup>
        <Toggle active={contrast} icon={Contrast} label="High contrast" onClick={() => setContrast((v) => !v)} />
        <Toggle active={motion} icon={Volume2} label="Reduced motion" onClick={() => setMotion((v) => !v)} />
      </div>

      <div className="mt-4 rounded-card border border-ink/10 bg-paper p-4 text-ink">
        <ReadingContent text={previewText} />
      </div>
      <p className="mt-3 text-sm font-bold text-moss">{message}</p>
    </section>
  );
}

function ControlGroup({
  label,
  icon: Icon,
  children
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-ink/10 bg-paper p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-graphite">
        <Icon aria-hidden="true" size={15} />
        {label}
      </p>
      <div className="flex min-h-11 items-center gap-2">{children}</div>
    </div>
  );
}

function Toggle({
  active,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "flex min-h-[5.65rem] items-center gap-3 rounded-card border p-3 text-left transition",
        active ? "border-moss bg-mint/14 text-ink" : "border-ink/10 bg-paper text-graphite hover:bg-cloud"
      )}
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={19} />
      <span className="text-sm font-black">{label}</span>
      <span className="ml-auto rounded-full bg-white px-2 py-1 text-xs font-black text-graphite">
        {active ? "ON" : "OFF"}
      </span>
    </button>
  );
}
