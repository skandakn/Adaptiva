"use client";

import { ArrowRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FocusMode({ concepts, explanation }: { concepts: string[]; explanation?: string }) {
  const [index, setIndex] = useState(0);
  const concept = concepts[index];

  return (
    <section className="rounded-card border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
            Concept {index + 1} of {concepts.length}
          </p>
          <h3 className="mt-3 text-3xl font-black text-ink">{concept}</h3>
        </div>
        <div className="h-3 w-44 overflow-hidden rounded-full bg-cloud" aria-hidden="true">
          <div
            className="h-full rounded-full bg-moss transition-all"
            style={{ width: `${((index + 1) / concepts.length) * 100}%` }}
          />
        </div>
      </div>
      <p className="mt-6 max-w-2xl whitespace-pre-line text-xl leading-9 text-graphite">
        {explanation ?? "This concept is shown by itself so the learner can focus before moving forward."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => setIndex(0)}>
          <RefreshCw aria-hidden="true" size={18} />
          Explain differently
        </Button>
        <Button type="button" onClick={() => setIndex((value) => Math.min(concepts.length - 1, value + 1))}>
          I am ready
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </div>
    </section>
  );
}
