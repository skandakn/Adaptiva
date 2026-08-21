"use client";

import { ArrowDown, Leaf, Volume2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReadingContent } from "./reading-content";
import { useReadingMode } from "./reading-mode-provider";

const normalText =
  "Photosynthesis is the biochemical process by which green plants convert light energy into chemical energy using chlorophyll.";

const adaptedText = "Photosynthesis\n\nPlants use sunlight to make food.\n\nMain idea:\nSUNLIGHT\nPLANT\nFOOD";

export function ReadingModeShowcase() {
  const { preferences, setEnabled, speak } = useReadingMode();

  return (
    <section className="rounded-card border border-ink/10 bg-white p-5 shadow-soft" aria-label="Reading Mode preview">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Reading Mode Preview</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Normal text becomes a calmer reading experience.</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">
            An optional reading format designed for readability and personalization.
          </p>
        </div>
        <span
          className={cn(
            "rounded-card border px-3 py-2 text-xs font-black uppercase tracking-[0.12em]",
            preferences.enabled ? "border-moss bg-mint/14 text-moss" : "border-ink/10 bg-paper text-graphite"
          )}
        >
          Reading Mode {preferences.enabled ? "ON" : "OFF"}
        </span>
      </div>

      <button
        type="button"
        aria-pressed={preferences.enabled}
        className={cn(
          "mt-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-card border px-4 text-left transition",
          preferences.enabled
            ? "border-moss bg-mint/14 text-ink"
            : "border-ink/10 bg-paper text-graphite hover:bg-cloud"
        )}
        onClick={() => setEnabled(!preferences.enabled)}
      >
        <span className="font-black">Reading Mode</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-moss">
          {preferences.enabled ? "ON" : "OFF"}
        </span>
      </button>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <div className="rounded-card border border-ink/10 bg-paper p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite">Normal Reading</p>
          <p className="mt-3 text-base leading-7 text-graphite">{normalText}</p>
        </div>
        <div className="hidden items-center px-1 text-moss lg:flex">
          <ArrowDown aria-hidden="true" className="-rotate-90" size={22} />
        </div>
        <div className="rounded-card border border-moss/25 bg-mint/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-moss">Adaptiva Reading Mode</p>
            <Leaf aria-hidden="true" className="text-moss" size={19} />
          </div>
          <ReadingContent className="mt-3 text-base leading-7 text-ink" text={adaptedText} />
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button type="button" variant="secondary" onClick={() => speak(adaptedText)}>
              <Volume2 aria-hidden="true" size={16} />
              Listen
            </Button>
            <Button type="button" variant="secondary">
              <WandSparkles aria-hidden="true" size={16} />
              Explain simply
            </Button>
            <Button type="button" variant="secondary">
              Break into steps
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
