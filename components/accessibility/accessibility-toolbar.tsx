"use client";

import { Contrast, Eye, LetterText, Minus, Plus, RotateCcw, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessibilityToolbar() {
  const [fontSize, setFontSize] = useState(18);
  const [spacing, setSpacing] = useState(1.7);
  const [contrast, setContrast] = useState(false);
  const [guide, setGuide] = useState(false);
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("high-contrast", contrast);
    document.body.classList.toggle("reduced-motion", motion);
    return () => {
      document.body.classList.remove("high-contrast", "reduced-motion");
    };
  }, [contrast, motion]);

  return (
    <section
      className="rounded-card border border-ink/10 bg-white p-4 shadow-soft"
      aria-label="Accessibility controls"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
            Accessibility Controls
          </p>
          <p className="text-sm text-graphite">Reading changes apply to the live preview.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => {
            setFontSize(18);
            setSpacing(1.7);
            setContrast(false);
            setGuide(false);
            setMotion(false);
          }}
        >
          <RotateCcw aria-hidden="true" size={16} />
          Reset
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <ControlGroup label="Text size">
          <Button
            variant="secondary"
            size="icon"
            type="button"
            aria-label="Decrease text size"
            onClick={() => setFontSize((value) => Math.max(16, value - 1))}
          >
            <Minus aria-hidden="true" size={18} />
          </Button>
          <span className="min-w-12 text-center text-sm font-black">{fontSize}px</span>
          <Button
            variant="secondary"
            size="icon"
            type="button"
            aria-label="Increase text size"
            onClick={() => setFontSize((value) => Math.min(24, value + 1))}
          >
            <Plus aria-hidden="true" size={18} />
          </Button>
        </ControlGroup>
        <ControlGroup label="Line spacing">
          <input
            aria-label="Line spacing"
            className="w-full accent-moss"
            max="2.2"
            min="1.4"
            step="0.1"
            type="range"
            value={spacing}
            onChange={(event) => setSpacing(Number(event.target.value))}
          />
        </ControlGroup>
        <Toggle active={contrast} icon={Contrast} label="High contrast" onClick={() => setContrast((v) => !v)} />
        <Toggle active={guide} icon={Eye} label="Focus guide" onClick={() => setGuide((v) => !v)} />
        <Toggle active={motion} icon={Volume2} label="Reduced motion" onClick={() => setMotion((v) => !v)} />
      </div>
      <div
        className={cn(
          "mt-4 rounded-card border border-ink/10 bg-paper p-4 text-ink",
          guide && "focus-guide"
        )}
        style={{ fontSize, lineHeight: spacing }}
      >
        <p className="dyslexia-reading">
          Photo-syn-the-sis is how green plants use LIGHT ENERGY to make CHEMICAL ENERGY.
        </p>
      </div>
    </section>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-ink/10 bg-paper p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-graphite">
        <LetterText aria-hidden="true" size={15} />
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
    </button>
  );
}
