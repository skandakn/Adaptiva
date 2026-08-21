"use client";

import { ArrowRight, Volume2, WandSparkles, List, Map } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReadingContent } from "@/components/reading/reading-content";
import { useReadingMode } from "@/components/reading/reading-mode-provider";

const ORIGINAL_TEXT =
  "Photosynthesis is the biochemical process by which green plants convert light energy into chemical energy using chlorophyll. The process occurs primarily in the chloroplasts and requires sunlight, carbon dioxide, and water.";

const ADAPTED_TEXT = "Photosynthesis\n\nPlants use sunlight to make food.\n\nMain idea:\nSUNLIGHT\nPLANT\nFOOD";

const stages = ["UNDERSTAND", "SIMPLIFY", "ADAPT"];

const steps = [
  { emoji: "☀", label: "SUNLIGHT" },
  { emoji: "🌱", label: "PLANT" },
  { emoji: "🍃", label: "FOOD" },
];

export function ProductShowcase() {
  const { speak } = useReadingMode();

  return (
    <section
      className="rounded-card border border-ink/10 bg-white p-5 shadow-soft"
      aria-label="Same knowledge, adapted experience — product preview"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
          Same Knowledge. Adapted For You.
        </p>
        <span className="rounded-card bg-mint/14 px-3 py-1 text-xs font-black text-moss">
          ✨ AI Demo
        </span>
      </div>

      {/* 3-column transformation */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
        {/* LEFT — Original Content */}
        <div className="rounded-card border border-ink/10 bg-paper p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-graphite">
            Original Content
          </p>
          <p className="mt-3 text-sm leading-6 text-graphite">{ORIGINAL_TEXT}</p>
          <div className="mt-3 rounded bg-ink/5 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-graphite/60">
              Dense text · Complex vocabulary · High reading level
            </p>
          </div>
        </div>

        {/* CENTER — Transformation indicator */}
        <div className="flex flex-col items-center justify-center gap-1 py-2 px-3">
          <div className="hidden items-center lg:flex">
            <ArrowRight aria-hidden="true" className="text-moss" size={18} />
          </div>
          <div className="rounded-card border border-moss/30 bg-mint/10 px-3 py-3 text-center">
            <p className="text-sm font-black text-moss">✨ ADAPTIVA AI</p>
            <div className="mt-2 flex flex-col items-center gap-1">
              {stages.map((stage, i) => (
                <div key={stage} className="flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-moss">
                    {stage}
                  </span>
                  {i < stages.length - 1 && (
                    <span aria-hidden="true" className="text-[10px] text-moss/50">
                      ↓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center">
            <ArrowRight aria-hidden="true" className="text-moss" size={18} />
          </div>
        </div>

        {/* RIGHT — Adapted Learning */}
        <div className="rounded-card border border-moss/25 bg-mint/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-moss">
            Adapted Learning
          </p>

          {/* Simplified text — responds to Reading Mode */}
          <ReadingContent
            className="mt-3 text-sm leading-6 text-ink"
            text={ADAPTED_TEXT}
            label="Adapted learning content"
          />

          {/* Emoji step chain */}
          <div
            className="mt-4 flex items-center justify-around rounded-card border border-moss/20 bg-white/60 px-3 py-3"
            aria-label="Main idea: Sunlight → Plant → Food"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-moss">
              Main Idea
            </p>
            <div className="flex items-center gap-1">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-1">
                  <div className="flex flex-col items-center">
                    <span className="text-base" aria-hidden="true">
                      {step.emoji}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-ink">
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="mb-3 text-[10px] text-moss/50"
                    >
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => speak(ADAPTED_TEXT)}
            >
              <Volume2 aria-hidden="true" size={13} />
              Listen
            </Button>
            <Button type="button" variant="secondary" size="sm">
              <WandSparkles aria-hidden="true" size={13} />
              Explain simply
            </Button>
            <Button type="button" variant="secondary" size="sm">
              <List aria-hidden="true" size={13} />
              Break into steps
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/learn">
                <Map aria-hidden="true" size={13} />
                Create Figure
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
