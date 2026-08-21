"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stages = ["Raw content", "Understanding", "Adaptive transformation", "Your learning mode"];

export function AdaptButton({ onComplete }: { onComplete?: () => void }) {
  const [active, setActive] = useState(false);
  const [stage, setStage] = useState(0);
  const [complete, setComplete] = useState(false);

  async function runAdaptation() {
    setActive(true);
    setComplete(false);
    for (let index = 0; index < stages.length; index += 1) {
      setStage(index);
      await new Promise((resolve) => setTimeout(resolve, 520));
    }
    setComplete(true);
    setActive(false);
    onComplete?.();
  }

  return (
    <div className="rounded-card border border-mint/30 bg-mint/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Hackathon Wow Moment</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Adapt This</h3>
        </div>
        <Button type="button" onClick={runAdaptation} disabled={active}>
          <Sparkles aria-hidden="true" size={18} />
          {active ? "Adapting" : "Adapt This"}
        </Button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {stages.map((label, index) => (
          <div
            key={label}
            className={cn(
              "rounded-card border p-3 transition",
              stage === index && active
                ? "border-amber bg-amber/20 shadow-lift"
                : index <= stage && complete
                  ? "border-moss bg-mint/16"
                  : "border-ink/10 bg-white"
            )}
          >
            <p className="text-sm font-black text-ink">{label}</p>
          </div>
        ))}
      </div>
      {complete ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {["simplified", "chunked", "readable", "audio-ready", "key concepts", "visual map"].map((item) => (
            <span key={item} className="flex items-center gap-2 text-sm font-black text-moss">
              <CheckCircle2 aria-hidden="true" size={17} />
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
