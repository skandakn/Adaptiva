"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { AccessibilityProfileCard } from "@/components/accessibility/profile-card";
import { supportOptions } from "@/lib/demo-data";
import type { AccessibilitySupport } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OnboardingFlow() {
  const [selected, setSelected] = useState<AccessibilitySupport[]>([
    "Dyslexia-friendly reading",
    "Focus support",
    "Simplified explanations",
    "Audio learning"
  ]);
  const [ready, setReady] = useState(false);

  function toggle(option: AccessibilitySupport) {
    setSelected((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Personalization</p>
        <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-ink sm:text-5xl">
          What support would make learning easier for you?
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-graphite">
          Adaptiva recommends a learning profile from preferences. It is not a medical diagnosis.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {supportOptions.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-card border p-4 text-left transition",
                  active
                    ? "border-moss bg-mint/14 text-ink shadow-sm"
                    : "border-ink/10 bg-white text-graphite hover:border-moss/35 hover:bg-cloud"
                )}
                onClick={() => toggle(option)}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full border",
                    active ? "border-moss bg-moss text-white" : "border-ink/20 bg-white"
                  )}
                >
                  {active ? <CheckCircle2 aria-hidden="true" size={17} /> : null}
                </span>
                <span className="font-black">{option}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" onClick={() => setReady(true)}>
            <Sparkles aria-hidden="true" size={18} />
            Create Adaptive Profile
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Use demo profile</Link>
          </Button>
        </div>
      </section>
      <aside>
        {ready ? (
          <div className="grid gap-4">
            <Panel>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
                Your Adaptiva profile is ready
              </p>
              <h2 className="mt-3 text-2xl font-black text-ink">Same knowledge. Built for you.</h2>
              <p className="mt-3 text-sm leading-7 text-graphite">
                Selected supports: {selected.join(", ")}
              </p>
            </Panel>
            <AccessibilityProfileCard />
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <AccessibilityProfileCard title="Profile Preview" />
        )}
      </aside>
    </div>
  );
}
