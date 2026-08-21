"use client";

import { ArrowRight, CheckCircle2, Presentation } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

const journey = [
  "Choose Dyslexia + Focus profile",
  "Open sample biology lesson",
  "Show original content",
  "Click Adapt This",
  "Show simplified content",
  "Click Read Aloud",
  "Generate mind map",
  "Ask AI to explain a difficult concept",
  "Switch to Live Lecture",
  "Demonstrate live transcription",
  "Open Architecture",
  "Show how the system works"
];

export function DemoJourney() {
  const [step, setStep] = useState(0);

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Demo Journey</p>
          <h2 className="mt-2 text-3xl font-black text-ink">Built-in judging script</h2>
        </div>
        <Presentation aria-hidden="true" className="text-moss" size={30} />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {journey.map((item, index) => (
          <button
            key={item}
            type="button"
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-card border px-3 text-left text-sm font-black transition",
              index === step
                ? "border-moss bg-mint/14 text-ink"
                : index < step
                  ? "border-moss/30 bg-cloud text-moss"
                  : "border-ink/10 bg-white text-graphite"
            )}
            onClick={() => setStep(index)}
          >
            <CheckCircle2 aria-hidden="true" size={17} />
            {item}
          </button>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" onClick={() => setStep((value) => Math.min(journey.length - 1, value + 1))}>
          Next demo step
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
        <Button variant="secondary" asChild>
          <Link href={step < 8 ? "/learn" : step < 10 ? "/live" : "/architecture"}>
            Open current stage
          </Link>
        </Button>
      </div>
    </Panel>
  );
}
